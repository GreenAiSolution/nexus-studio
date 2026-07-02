/**
 * NEXUS AI — tRPC Routers for Workflow Triggering & Management
 *
 * Provides type-safe endpoints for:
 * - Triggering Inngest workflows
 * - Checking workflow status
 * - Managing subscriptions, integrations, contracts
 * - Monitoring system health & costs
 */

import { router, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';

// ═════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE: Rate Limiting & Subscription Checks
// ═════════════════════════════════════════════════════════════════════════════

const withTierCheck = (tierLimit: 'agents' | 'tasks') =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      include: { subscription: true },
    });

    if (!org?.subscription) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No active subscription',
      });
    }

    if (tierLimit === 'agents') {
      const activeAgents = await prisma.agent.count({
        where: {
          organizationId: ctx.orgId,
          status: { not: 'ARCHIVED' },
        },
      });

      if (activeAgents >= org.subscription.maxAgents) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Agent limit reached: ${org.subscription.maxAgents}`,
        });
      }
    }

    if (tierLimit === 'tasks') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyRuns = await prisma.task.count({
        where: {
          organizationId: ctx.orgId,
          createdAt: { gte: monthStart },
        },
      });

      if (monthlyRuns >= org.subscription.monthlyRunLimit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Monthly run limit reached: ${org.subscription.monthlyRunLimit}`,
        });
      }
    }

    return next();
  });

// ═════════════════════════════════════════════════════════════════════════════
// WORKFLOWS ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const workflowsRouter = router({
  status: protectedProcedure
    .input(z.object({ workflowRunId: z.string() }))
    .query(async ({ input, ctx }) => {
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id: input.workflowRunId },
      });

      if (!workflowRun) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow run not found',
        });
      }

      if (workflowRun.organizationId !== ctx.orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return {
        id: workflowRun.id,
        functionId: workflowRun.functionId,
        status: workflowRun.status,
        createdAt: workflowRun.createdAt,
        completedAt: workflowRun.completedAt,
        durationMs: workflowRun.durationMs,
        error: workflowRun.errorMessage,
        inngestRunId: workflowRun.inngestRunId,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        functionId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const workflowRuns = await prisma.workflowRun.findMany({
        where: {
          organizationId: ctx.orgId,
          functionId: input.functionId,
          status: input.status as any,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      const total = await prisma.workflowRun.count({
        where: {
          organizationId: ctx.orgId,
          functionId: input.functionId,
          status: input.status as any,
        },
      });

      return {
        workflowRuns: workflowRuns.map((wr) => ({
          id: wr.id,
          functionId: wr.functionId,
          status: wr.status,
          createdAt: wr.createdAt,
          completedAt: wr.completedAt,
          durationMs: wr.durationMs,
          error: wr.errorMessage,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
// AGENTS ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const agentsRouter = router({
  create: withTierCheck('agents')
    .input(
      z.object({
        name: z.string(),
        role: z.string(),
        model: z.string(),
        tools: z.array(z.string()),
        systemPrompt: z.string().optional(),
        schedule: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await prisma.agent.create({
        data: {
          organizationId: ctx.orgId,
          name: input.name,
          role: input.role,
          model: input.model as any,
          tools: input.tools,
          systemPrompt: input.systemPrompt,
          schedule: input.schedule,
          status: 'DRAFT',
        },
      });

      const eventId = await inngest.send({
        name: 'agent/lifecycle.create.requested',
        data: {
          organizationId: ctx.orgId,
          agentId: agent.id,
          name: input.name,
          role: input.role,
          model: input.model,
          tools: input.tools,
          systemPrompt: input.systemPrompt,
          schedule: input.schedule,
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: ctx.orgId,
          userId: ctx.userId,
          action: 'AGENT_CREATED',
          resource: 'Agent',
          resourceId: agent.id,
          changes: JSON.stringify({
            name: input.name,
            role: input.role,
            model: input.model,
          }),
          metadata: JSON.stringify({
            inngest_event_id: eventId,
          }),
        },
      });

      return {
        agentId: agent.id,
        status: 'DRAFT',
        workflowTriggered: true,
        eventId,
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const agents = await prisma.agent.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: 'desc' },
    });

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      status: agent.status,
      lastRun: agent.lastRun,
      nextRun: agent.nextRun,
    }));
  }),

  detail: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const agent = await prisma.agent.findUnique({
        where: { id: input.agentId },
        include: {
          tasks: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        model: agent.model,
        status: agent.status,
        systemPrompt: agent.systemPrompt?.substring(0, 200),
        tools: agent.tools,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        createdAt: agent.createdAt,
        sandboxTestsPassed: agent.sandboxTestsPassed,
        sandboxTestsFailed: agent.sandboxTestsFailed,
        recentTasks: agent.tasks.map((t) => ({
          id: t.id,
          status: t.status,
          createdAt: t.createdAt,
        })),
      };
    }),

  pause: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const agent = await prisma.agent.findUnique({
        where: { id: input.agentId },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      const updated = await prisma.agent.update({
        where: { id: input.agentId },
        data: { status: 'PAUSED' },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: ctx.orgId,
          userId: ctx.userId,
          action: 'AGENT_PAUSED',
          resource: 'Agent',
          resourceId: input.agentId,
        },
      });

      return { status: updated.status };
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
// TASKS ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const tasksRouter = router({
  submit: withTierCheck('tasks')
    .input(
      z.object({
        agentId: z.string(),
        prompt: z.string(),
        priority: z.number().optional(),
        timeoutMs: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await prisma.agent.findUnique({
        where: { id: input.agentId },
      });

      if (!agent || agent.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      if (agent.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Agent is ${agent.status}`,
        });
      }

      const task = await prisma.task.create({
        data: {
          organizationId: ctx.orgId,
          agentId: input.agentId,
          userId: ctx.userId,
          prompt: input.prompt,
          status: 'PENDING',
          priority: input.priority || 0,
        },
      });

      const eventId = await inngest.send({
        name: 'task/execute.requested',
        data: {
          organizationId: ctx.orgId,
          taskId: task.id,
          agentId: input.agentId,
          prompt: input.prompt,
          priority: input.priority || 0,
          timeoutMs: input.timeoutMs || 300000,
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: ctx.orgId,
          userId: ctx.userId,
          action: 'TASK_CREATED',
          resource: 'Task',
          resourceId: task.id,
          changes: JSON.stringify({ agent_id: input.agentId }),
          metadata: JSON.stringify({ inngest_event_id: eventId }),
        },
      });

      return {
        taskId: task.id,
        status: 'PENDING',
        createdAt: task.createdAt,
        eventId,
      };
    }),

  status: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input, ctx }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: { execution: true },
      });

      if (!task || task.organizationId !== ctx.orgId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return {
        id: task.id,
        status: task.status,
        prompt: task.prompt,
        result: task.result,
        error: task.error,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        durationMs: task.duration,
        execution: task.execution
          ? {
              model: task.execution.modelUsed,
              tokens: task.execution.totalTokens,
              cost: task.execution.costUSD,
            }
          : null,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const tasks = await prisma.task.findMany({
        where: {
          organizationId: ctx.orgId,
          agentId: input.agentId,
          status: input.status as any,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: { execution: true },
      });

      const total = await prisma.task.count({
        where: {
          organizationId: ctx.orgId,
          agentId: input.agentId,
          status: input.status as any,
        },
      });

      return {
        tasks: tasks.map((t) => ({
          id: t.id,
          agentId: t.agentId,
          status: t.status,
          prompt: t.prompt.substring(0, 100),
          createdAt: t.createdAt,
          completedAt: t.completedAt,
          durationMs: t.duration,
          cost: t.execution?.costUSD || 0,
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
// CONTRACTS ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const contractsRouter = router({
  process: protectedProcedure
    .input(
      z.object({
        contractType: z.string(),
        jurisdiction: z.string().optional(),
        clientName: z.string().optional(),
        counterpartyName: z.string().optional(),
        contractText: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const contract = await prisma.legalContract.create({
        data: {
          organizationId: ctx.orgId,
          title: `${input.contractType} - ${new Date().toLocaleDateString()}`,
          contractType: input.contractType as any,
          jurisdiction: input.jurisdiction,
          status: 'DRAFT',
          clioClientName: input.clientName,
        },
      });

      const eventId = await inngest.send({
        name: 'legal/contract.process.requested',
        data: {
          organizationId: ctx.orgId,
          contractId: contract.id,
          contractType: input.contractType,
          jurisdiction: input.jurisdiction,
          clientName: input.clientName,
          counterpartyName: input.counterpartyName,
          contractText: input.contractText,
        },
      });

      return {
        contractId: contract.id,
        status: 'DRAFT',
        eventId,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const contracts = await prisma.legalContract.findMany({
        where: {
          organizationId: ctx.orgId,
          status: input.status as any,
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });

      return contracts.map((c) => ({
        id: c.id,
        title: c.title,
        contractType: c.contractType,
        status: c.status,
        createdAt: c.createdAt,
      }));
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
// COSTS ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const costsRouter = router({
  summary: protectedProcedure
    .input(
      z.object({
        period: z.enum(['day', 'month']).default('month'),
      })
    )
    .query(async ({ input, ctx }) => {
      const now = new Date();
      const periodStart = new Date();

      if (input.period === 'month') {
        periodStart.setDate(1);
      } else {
        periodStart.setDate(periodStart.getDate() - 1);
      }

      const metrics = await prisma.costMetric.findMany({
        where: {
          organizationId: ctx.orgId,
          periodStart: { gte: periodStart },
        },
      });

      const totalCost = metrics.reduce((sum, m) => sum + m.estimatedCostUSD, 0);
      const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
      const totalTasks = metrics.reduce((sum, m) => sum + m.taskCount, 0);

      const byModel = metrics.reduce(
        (acc, m) => {
          if (!acc[m.model]) {
            acc[m.model] = { tokens: 0, cost: 0 };
          }
          acc[m.model].tokens += m.totalTokens;
          acc[m.model].cost += m.estimatedCostUSD;
          return acc;
        },
        {} as Record<string, { tokens: number; cost: number }>
      );

      return {
        period: input.period,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalTokens,
        totalTasks,
        avgCostPerTask:
          totalTasks > 0
            ? parseFloat((totalCost / totalTasks).toFixed(4))
            : 0,
        byModel: Object.entries(byModel).map(([model, data]) => ({
          model,
          tokens: data.tokens,
          cost: parseFloat(data.cost.toFixed(2)),
        })),
      };
    }),

  getCostMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get costs for current month
    const monthlyMetrics = await prisma.costMetric.findMany({
      where: {
        organizationId: ctx.orgId,
        createdAt: { gte: monthStart },
      },
    });

    const monthlySpend = monthlyMetrics.reduce((sum, m) => sum + m.estimatedCostUSD, 0);

    // Get subscription tier for budget calculation
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: ctx.orgId },
    });

    // Estimate budget (using monthlyTokenLimit as a proxy, ~$0.0001 per 100 tokens)
    const estimatedBudget = subscription?.monthlyTokenLimit
      ? subscription.monthlyTokenLimit * 0.000001
      : 500; // Default $500 budget estimate

    const remainingBudget = estimatedBudget - monthlySpend;

    // Extrapolate to end of month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const estimatedMonthEnd = (monthlySpend / daysElapsed) * daysInMonth;

    return {
      monthlySpend: parseFloat(monthlySpend.toFixed(2)),
      remainingBudget: parseFloat(remainingBudget.toFixed(2)),
      estimatedMonthEnd: parseFloat(estimatedMonthEnd.toFixed(2)),
      topCostModels: monthlyMetrics
        .reduce(
          (acc, m) => {
            const existing = acc.find((x) => x.model === m.model);
            if (existing) {
              existing.totalCost += m.estimatedCostUSD;
              existing.count += 1;
            } else {
              acc.push({
                model: m.model,
                totalCost: m.estimatedCostUSD,
                count: 1,
              });
            }
            return acc;
          },
          [] as Array<{ model: string; totalCost: number; count: number }>
        )
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 5),
    };
  }),

  getModelRecommendations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const { getModelRecommendations } = await import('@/lib/agents/model-router');

    const recommendations = await getModelRecommendations(ctx.orgId);

    return recommendations.map((rec) => ({
      currentModel: rec.currentModel,
      recommendedModel: rec.recommendedModel,
      savingsPercentage: rec.savingsPercentage,
    }));
  }),

  estimateModelCost: protectedProcedure
    .input(
      z.object({
        model: z.enum([
          'CLAUDE_HAIKU',
          'CLAUDE_SONNET',
          'CLAUDE_OPUS',
          'GPT_4O',
          'GEMINI_PRO',
          'LLAMA_70B',
          'MISTRAL_LARGE',
        ]),
        inputTokens: z.number().min(0),
        outputTokens: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      const { estimateTaskCost } = await import('@/lib/agents/model-router');
      const { MODEL_PRICING } = await import('@/lib/agents/model-router');

      const cost = estimateTaskCost(input.model, input.inputTokens, input.outputTokens);
      const pricing = MODEL_PRICING[input.model];

      return {
        model: input.model,
        estimatedCost: parseFloat(cost.toFixed(4)),
        inputTokenPrice: pricing.inputTokenPrice,
        outputTokenPrice: pricing.outputTokenPrice,
        avgLatencyMs: pricing.avgLatencyMs,
      };
    }),

  compareModels: protectedProcedure
    .input(
      z.object({
        inputTokens: z.number().min(0),
        outputTokens: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      const { compareModelCosts, MODEL_PRICING } = await import('@/lib/agents/model-router');

      const costs = compareModelCosts(input.inputTokens, input.outputTokens);

      return costs.map((item) => ({
        model: item.model,
        estimatedCost: parseFloat(item.cost.toFixed(4)),
        pricing: MODEL_PRICING[item.model],
      }));
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
// MONITORING ROUTER
// ═════════════════════════════════════════════════════════════════════════════

export const monitoringRouter = router({
  health: protectedProcedure.query(async ({ ctx }) => {
    const last5min = new Date(Date.now() - 5 * 60 * 1000);

    const executions = await prisma.taskExecution.findMany({
      where: {
        organizationId: ctx.orgId,
        createdAt: { gte: last5min },
      },
    });

    if (executions.length === 0) {
      return {
        status: 'no_data',
        metrics: {},
      };
    }

    const durations = executions
      .filter((e) => e.durationMs)
      .map((e) => e.durationMs || 0)
      .sort((a, b) => a - b);

    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
    const failedCount = executions.filter(
      (e) => e.status === 'FAILED'
    ).length;
    const errorRate = failedCount / executions.length;

    return {
      status: p95 < 100 && errorRate < 0.001 ? 'healthy' : 'degraded',
      metrics: {
        latencyP95: p95,
        errorRate: parseFloat(errorRate.toFixed(4)),
        executionCount: executions.length,
        failedCount,
      },
    };
  }),
});
