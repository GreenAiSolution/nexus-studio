import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { SubscriptionTier } from '@prisma/client';

const TIER_LIMITS = {
  RECRUIT: { maxAgents: 1, maxConnectors: 3, maxModels: 2, monthlyRunLimit: 500 },
  OPERATOR: { maxAgents: 5, maxConnectors: 10, maxModels: 5, monthlyRunLimit: 5000 },
  EMPIRE: { maxAgents: -1, maxConnectors: -1, maxModels: -1, monthlyRunLimit: -1 },
  CUSTOM: { maxAgents: -1, maxConnectors: -1, maxModels: -1, monthlyRunLimit: -1 },
};

const TIER_PRICING = {
  RECRUIT: 97,
  OPERATOR: 497,
  EMPIRE: 2497,
};

export const subscriptionRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    let subscription = await prisma.subscription.findUnique({
      where: { organizationId: ctx.orgId },
    });

    // Create default RECRUIT subscription if doesn't exist
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: ctx.orgId,
          tier: 'RECRUIT',
          status: 'active',
          maxAgents: 1,
          maxConnectors: 3,
          maxModels: 2,
          monthlyRunLimit: 500,
        },
      });
    }

    return {
      id: subscription.id,
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      limits: {
        maxAgents: subscription.maxAgents,
        maxConnectors: subscription.maxConnectors,
        maxModels: subscription.maxModels,
        monthlyRunLimit: subscription.monthlyRunLimit,
      },
    };
  }),

  getTiers: protectedProcedure.query(async () => {
    return [
      {
        id: 'RECRUIT',
        name: 'RECRUIT',
        price: 97,
        description: 'Perfect for trying it out',
        features: {
          maxAgents: 1,
          maxConnectors: 3,
          maxModels: 2,
          monthlyRunLimit: 500,
        },
      },
      {
        id: 'OPERATOR',
        name: 'OPERATOR',
        price: 497,
        description: 'For growing operations',
        features: {
          maxAgents: 5,
          maxConnectors: 10,
          maxModels: 5,
          monthlyRunLimit: 5000,
        },
      },
      {
        id: 'EMPIRE',
        name: 'EMPIRE',
        price: 2497,
        description: 'Enterprise-grade automation',
        features: {
          maxAgents: -1,
          maxConnectors: -1,
          maxModels: -1,
          monthlyRunLimit: -1,
        },
      },
    ];
  }),

  canCreateAgent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: ctx.orgId },
    });

    if (!subscription) throw new TRPCError({ code: 'NOT_FOUND' });

    const agentCount = await prisma.agent.count({
      where: { organizationId: ctx.orgId },
    });

    const canCreate =
      subscription.maxAgents === -1 || agentCount < subscription.maxAgents;

    return {
      allowed: canCreate,
      current: agentCount,
      limit: subscription.maxAgents,
      message: !canCreate
        ? `You can only create ${subscription.maxAgents} agents on the ${subscription.tier} plan. Upgrade to create more.`
        : undefined,
    };
  }),

  upgradeTier: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['RECRUIT', 'OPERATOR', 'EMPIRE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const subscription = await prisma.subscription.findUnique({
        where: { organizationId: ctx.orgId },
      });

      if (!subscription) throw new TRPCError({ code: 'NOT_FOUND' });

      const limits = TIER_LIMITS[input.tier as keyof typeof TIER_LIMITS];

      const updated = await prisma.subscription.update({
        where: { organizationId: ctx.orgId },
        data: {
          tier: input.tier as SubscriptionTier,
          maxAgents: limits.maxAgents,
          maxConnectors: limits.maxConnectors,
          maxModels: limits.maxModels,
          monthlyRunLimit: limits.monthlyRunLimit,
        },
      });

      return updated;
    }),

  createCheckoutSession: protectedProcedure
    .input(z.object({ tier: z.enum(['RECRUIT', 'OPERATOR', 'EMPIRE']) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // TODO: Integrate with Stripe
      const price = TIER_PRICING[input.tier as keyof typeof TIER_PRICING];

      return {
        tier: input.tier,
        price,
        // In Phase 5, add actual Stripe session creation here
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?tier=${input.tier}`,
      };
    }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: ctx.orgId },
    });

    if (!subscription) throw new TRPCError({ code: 'NOT_FOUND' });

    const agentCount = await prisma.agent.count({
      where: { organizationId: ctx.orgId },
    });

    const integrationCount = await prisma.integration.count({
      where: { organizationId: ctx.orgId, isActive: true },
    });

    const tasksThisMonth = await prisma.task.count({
      where: {
        organizationId: ctx.orgId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    return {
      agents: { used: agentCount, limit: subscription.maxAgents },
      integrations: { used: integrationCount, limit: subscription.maxConnectors },
      tasksThisMonth: {
        used: tasksThisMonth,
        limit: subscription.monthlyRunLimit,
      },
    };
  }),
});
