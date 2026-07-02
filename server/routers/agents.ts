import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { AgentStatus, AgentModel } from '@prisma/client';

export const agentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const agents = await prisma.agent.findMany({
      where: { organizationId: ctx.orgId },
      select: {
        id: true,
        name: true,
        description: true,
        role: true,
        status: true,
        model: true,
        lastRun: true,
        nextRun: true,
        isRunning: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return agents;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        role: z.string().min(1).max(400),
        model: z.nativeEnum(AgentModel).default('CLAUDE_OPUS'),
        systemPrompt: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          description: input.description,
          role: input.role,
          model: input.model,
          systemPrompt: input.systemPrompt,
          status: 'DRAFT',
          tools: [],
        },
      });

      return agent;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.findUnique({
        where: { id: input.id },
        include: {
          tasks: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return agent;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        role: z.string().min(1).max(100).optional(),
        model: z.nativeEnum(AgentModel).optional(),
        systemPrompt: z.string().max(5000).optional(),
        status: z.nativeEnum(AgentStatus).optional(),
        tools: z.array(z.string()).optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(100).max(10000).optional(),
        schedule: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.findUnique({
        where: { id: input.id },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const updated = await prisma.agent.update({
        where: { id: input.id },
        data: {
          name: input.name ?? agent.name,
          description: input.description ?? agent.description,
          role: input.role ?? agent.role,
          model: input.model ?? agent.model,
          systemPrompt: input.systemPrompt ?? agent.systemPrompt,
          status: input.status ?? agent.status,
          tools: input.tools ?? agent.tools,
          temperature: input.temperature ?? agent.temperature,
          maxTokens: input.maxTokens ?? agent.maxTokens,
          schedule: input.schedule ?? agent.schedule,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.findUnique({
        where: { id: input.id },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await prisma.agent.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  activate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.findUnique({
        where: { id: input.id },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const updated = await prisma.agent.update({
        where: { id: input.id },
        data: { status: 'ACTIVE' },
      });

      return updated;
    }),

  execute: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        input: z.string(),
        allowToolCalls: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input: { id, input: prompt, allowToolCalls } }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const agent = await prisma.agent.findUnique({
        where: { id },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (allowToolCalls) {
        const { executeAgentWithTools } = await import('@/lib/agents/function-caller');
        const result = await executeAgentWithTools(id, ctx.orgId, prompt);

        return {
          success: true,
          response: result.finalResponse,
          toolCalls: result.toolCalls,
          toolResults: result.results,
          turnsUsed: result.turnsUsed,
        };
      } else {
        const { executeAgent } = await import('@/lib/agents/executor');
        const result = await executeAgent({
          organizationId: ctx.orgId,
          agentId: id,
          userId: ctx.userId,
          taskInput: prompt,
        });

        return {
          success: true,
          response: result.output,
          modelUsed: result.modelUsed,
          cost: result.costUSD,
        };
      }
    }),
});
