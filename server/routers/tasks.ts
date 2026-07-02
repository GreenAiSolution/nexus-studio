import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { TRPCError } from '@trpc/server';
import { TaskStatus } from '@prisma/client';

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const tasks = await prisma.task.findMany({
      where: { organizationId: ctx.orgId },
      include: {
        agent: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return tasks;
  }),

  create: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        prompt: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId || !ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify agent belongs to org
      const agent = await prisma.agent.findUnique({
        where: { id: input.agentId },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          organizationId: ctx.orgId,
          agentId: input.agentId,
          userId: ctx.userId,
          prompt: input.prompt,
          status: 'PENDING',
        },
      });

      // Queue task execution with Inngest
      try {
        await inngest.send({
          name: 'agent/task.execute',
          data: {
            taskId: task.id,
            agentId: input.agentId,
            organizationId: ctx.orgId,
            prompt: input.prompt,
          },
        });
      } catch (error) {
        console.error('Failed to queue task with Inngest:', error);
        // Continue anyway - task is created in DB
      }

      return task;
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const where = {
        organizationId: ctx.orgId,
        ...(input.agentId && { agentId: input.agentId }),
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            agent: {
              select: { name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.task.count({ where }),
      ]);

      return { tasks, total, limit: input.limit, offset: input.offset };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: {
          agent: true,
        },
      });

      if (!task || task.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return task;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(TaskStatus),
        result: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const task = await prisma.task.findUnique({
        where: { id: input.id },
      });

      if (!task || task.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const now = new Date();
      const duration =
        task.startedAt && input.status === 'COMPLETED'
          ? now.getTime() - task.startedAt.getTime()
          : undefined;

      const updated = await prisma.task.update({
        where: { id: input.id },
        data: {
          status: input.status,
          result: input.result,
          error: input.error,
          completedAt:
            input.status === 'COMPLETED' || input.status === 'FAILED'
              ? now
              : undefined,
          startedAt: input.status === 'RUNNING' && !task.startedAt ? now : undefined,
          duration,
        },
      });

      return updated;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const task = await prisma.task.findUnique({
        where: { id: input.id },
      });

      if (!task || task.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (task.status === 'COMPLETED' || task.status === 'FAILED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel a completed or failed task',
        });
      }

      const updated = await prisma.task.update({
        where: { id: input.id },
        data: { status: 'CANCELED' },
      });

      return updated;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const [total, completed, failed, running] = await Promise.all([
      prisma.task.count({ where: { organizationId: ctx.orgId } }),
      prisma.task.count({
        where: { organizationId: ctx.orgId, status: 'COMPLETED' },
      }),
      prisma.task.count({
        where: { organizationId: ctx.orgId, status: 'FAILED' },
      }),
      prisma.task.count({
        where: { organizationId: ctx.orgId, status: 'RUNNING' },
      }),
    ]);

    const avgDuration = await prisma.task.aggregate({
      where: {
        organizationId: ctx.orgId,
        status: 'COMPLETED',
        duration: { not: null },
      },
      _avg: { duration: true },
    });

    return {
      total,
      completed,
      failed,
      running,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDuration: avgDuration._avg.duration || 0,
    };
  }),
});
