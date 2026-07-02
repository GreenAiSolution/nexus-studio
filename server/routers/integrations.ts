import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { IntegrationProvider } from '@prisma/client';

export const integrationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const integrations = await prisma.integration.findMany({
      where: { organizationId: ctx.orgId },
      select: {
        id: true,
        provider: true,
        name: true,
        displayName: true,
        isActive: true,
        lastSyncAt: true,
        lastError: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations;
  }),

  create: protectedProcedure
    .input(
      z.object({
        provider: z.nativeEnum(IntegrationProvider),
        name: z.string().min(1).max(100),
        displayName: z.string().max(100).optional(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
        config: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Check if already connected
      const existing = await prisma.integration.findUnique({
        where: {
          organizationId_provider: {
            organizationId: ctx.orgId,
            provider: input.provider,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `${input.provider} is already connected`,
        });
      }

      const integration = await prisma.integration.create({
        data: {
          organizationId: ctx.orgId,
          provider: input.provider,
          name: input.name,
          displayName: input.displayName || input.name,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          config: input.config ? JSON.stringify(input.config) : null,
          isActive: true,
        },
      });

      return integration;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const integration = await prisma.integration.findUnique({
        where: { id: input.id },
      });

      if (!integration || integration.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Don't expose tokens to client
      const { accessToken, refreshToken, ...safe } = integration;
      return safe;
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const integration = await prisma.integration.findUnique({
        where: { id: input.id },
      });

      if (!integration || integration.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await prisma.integration.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        lastError: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const integration = await prisma.integration.findUnique({
        where: { id: input.id },
      });

      if (!integration || integration.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const updated = await prisma.integration.update({
        where: { id: input.id },
        data: {
          isActive: input.isActive ?? integration.isActive,
          lastError: input.lastError,
          lastSyncAt: new Date(),
        },
      });

      return updated;
    }),

  getAvailable: protectedProcedure.query(async () => {
    // Return all available integrations for user to connect
    const providers = Object.values(IntegrationProvider);
    return providers.map((provider) => ({
      provider,
      displayName: provider.replace(/_/g, ' '),
      icon: `${provider.toLowerCase()}`,
      description: `Connect to ${provider.replace(/_/g, ' ')}`,
    }));
  }),

  startConnect: protectedProcedure
    .input(z.enum(['SALESFORCE', 'SLACK', 'HUBSPOT']))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Check if already connected (excluding SLACK since multiple workspaces are allowed)
      if (input !== 'SLACK') {
        const existing = await prisma.integration.findUnique({
          where: {
            organizationId_provider: {
              organizationId: ctx.orgId,
              provider: input,
            },
          },
        });

        if (existing && existing.isActive) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `${input} is already connected`,
          });
        }
      }

      // Return OAuth start URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      return {
        redirectUrl: `${baseUrl}/api/oauth/${input.toLowerCase()}/start`,
      };
    }),

  getHealth: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const integration = await prisma.integration.findUnique({
        where: { id: input.integrationId },
        include: {
          syncLogs: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!integration || integration.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const lastSync = integration.syncLogs[0];
      const isHealthy = integration.isActive && !integration.lastError;

      return {
        integrationId: integration.id,
        provider: integration.provider,
        isActive: integration.isActive,
        isHealthy,
        lastSyncAt: integration.lastSyncAt,
        lastError: integration.lastError,
        errorCount: integration.errorCount,
        nextRetryAt: lastSync?.nextRetryAt,
        recentSyncs: integration.syncLogs.map((log) => ({
          id: log.id,
          status: log.syncStatus,
          recordsSynced: log.recordsSynced,
          errorMessage: log.errorMessage,
          completedAt: log.completedAt,
        })),
      };
    }),

  syncNow: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const integration = await prisma.integration.findUnique({
        where: { id: input.integrationId },
      });

      if (!integration || integration.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Trigger manual sync
      const { inngest } = await import('@/inngest/client');
      const eventId = await inngest.send({
        name: 'integrations/sync.scheduled',
        data: {
          organizationId: ctx.orgId,
          integrationId: integration.id,
          provider: integration.provider,
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          organizationId: ctx.orgId,
          userId: ctx.userId,
          action: 'INTEGRATION_SYNCED',
          resource: 'Integration',
          resourceId: integration.id,
          metadata: JSON.stringify({ manual: true, eventId }),
        },
      });

      return {
        ok: true,
        eventId,
        message: `Sync triggered for ${integration.provider}`,
      };
    }),
});
