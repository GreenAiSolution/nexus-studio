import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { listClioMatters } from '@/lib/legal/dms';

const contractTypeSchema = z.enum([
  'NDA', 'MSA', 'SOW', 'EMPLOYMENT', 'COMMERCIAL_LEASE',
  'SAAS_AGREEMENT', 'VENDOR_AGREEMENT', 'INDEPENDENT_CONTRACTOR', 'OTHER',
]);

export const legalRouter = router({
  // List contracts for the org
  listContracts: protectedProcedure
    .input(z.object({
      status: z.enum(['DRAFT','PENDING_REVIEW','IN_REVIEW','REVISION_REQUESTED','APPROVED','EXECUTED','ARCHIVED']).optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.orgId;
      const contracts = await prisma.legalContract.findMany({
        where: {
          organizationId,
          ...(input.status ? { status: input.status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          reviews: { orderBy: { requestedAt: 'desc' }, take: 1 },
          _count: { select: { auditEvents: true } },
        },
      });

      const hasMore = contracts.length > input.limit;
      return {
        contracts: contracts.slice(0, input.limit),
        nextCursor: hasMore ? contracts[input.limit - 1].id : undefined,
      };
    }),

  // Get single contract with full audit trail
  getContract: protectedProcedure
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await prisma.legalContract.findFirst({
        where: { id: input.contractId, organizationId: ctx.orgId },
        include: {
          reviews: { orderBy: { requestedAt: 'desc' } },
          auditEvents: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!contract) throw new TRPCError({ code: 'NOT_FOUND' });
      return contract;
    }),

  // Create contract and trigger draft generation
  createContract: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      contractType: contractTypeSchema,
      jurisdiction: z.string().default('CA'),
      clientName: z.string().min(1),
      counterpartyName: z.string().min(1),
      matterValue: z.number().optional(),
      clioMatterId: z.string().optional(),
      playbookId: z.string().optional(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: organizationId, userId } = ctx;

      const contract = await prisma.legalContract.create({
        data: {
          organizationId,
          title: input.title,
          contractType: input.contractType as any,
          jurisdiction: input.jurisdiction,
          clioMatterId: input.clioMatterId,
          clioClientName: input.clientName,
          matterValue: input.matterValue,
          playbookId: input.playbookId,
          status: 'DRAFT',
        },
      });

      // Trigger Inngest draft generation
      await inngest.send({
        name: 'legal/contract.draft.requested',
        data: {
          contractId: contract.id,
          organizationId,
          contractType: input.contractType,
          jurisdiction: input.jurisdiction,
          clientName: input.clientName,
          counterpartyName: input.counterpartyName,
          matterValue: input.matterValue,
          playbookId: input.playbookId,
          additionalContext: input.additionalContext,
        },
      });

      return contract;
    }),

  // Submit attorney review decision
  submitReviewDecision: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      decision: z.enum(['APPROVE', 'REVISE', 'ESCALATE', 'REJECT']),
      comments: z.string().optional(),
      dmsProvider: z.enum(['CLIO', 'NETDOCUMENTS', 'IMANAGE']).optional(),
      clioMatterId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId: organizationId, userId } = ctx;

      // Verify contract belongs to org
      const contract = await prisma.legalContract.findFirst({
        where: { id: input.contractId, organizationId },
      });
      if (!contract) throw new TRPCError({ code: 'NOT_FOUND' });

      await inngest.send({
        name: 'legal/attorney.decision.submitted',
        data: {
          contractId: input.contractId,
          organizationId,
          reviewerUserId: userId,
          decision: input.decision,
          comments: input.comments,
          dmsProvider: input.dmsProvider,
          clioMatterId: input.clioMatterId ?? contract.clioMatterId ?? undefined,
        },
      });

      return { contractId: input.contractId, decision: input.decision };
    }),

  // Trigger risk scan on existing contract text
  scanRisks: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      contractText: z.string().min(1),
      jurisdiction: z.string().default('CA'),
      matterValue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.orgId;
      await inngest.send({
        name: 'legal/contract.risk.scan.requested',
        data: { ...input, organizationId },
      });
      return { queued: true };
    }),

  // List audit trail for a contract
  getAuditTrail: protectedProcedure
    .input(z.object({ contractId: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.legalAuditEvent.findMany({
        where: { contractId: input.contractId, organizationId: ctx.orgId },
        orderBy: { createdAt: 'asc' },
      });
    }),

  // List playbooks
  listPlaybooks: protectedProcedure
    .input(z.object({ contractType: contractTypeSchema.optional() }))
    .query(async ({ ctx, input }) => {
      return prisma.legalPlaybook.findMany({
        where: {
          organizationId: ctx.orgId,
          ...(input.contractType ? { contractType: input.contractType as any } : {}),
        },
        orderBy: { name: 'asc' },
      });
    }),

  // Create playbook
  createPlaybook: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      contractType: contractTypeSchema,
      jurisdiction: z.string().optional(),
      rules: z.array(z.object({
        clauseType: z.string(),
        position: z.enum(['must-have', 'acceptable-with-modification', 'deal-breaker']),
        standardLanguage: z.string(),
        fallbackLanguage: z.string().optional(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.legalPlaybook.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          contractType: input.contractType as any,
          jurisdiction: input.jurisdiction,
          rules: JSON.stringify({ rules: input.rules }),
        },
      });
    }),

  // Pull matter context from Clio
  getClioMatters: protectedProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listClioMatters(ctx.orgId, input.query);
    }),
});
