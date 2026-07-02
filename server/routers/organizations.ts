import { router, protectedProcedure, publicProcedure } from '../trpc';
import { prisma } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import { TRPCError } from '@trpc/server';

export const organizationsRouter = router({
  // Public procedure to setup org on first login
  getOrCreate: publicProcedure.query(async () => {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organizations: true },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || `user-${userId.slice(0, 8)}@clerk.local`,
          name: clerkUser?.fullName || clerkUser?.firstName || undefined,
        },
        include: { organizations: true },
      });
    }

    // If user has no organizations, create a default one
    if (user.organizations.length === 0) {
      const org = await prisma.organization.create({
        data: {
          name: 'My Organization',
          slug: `org-${userId.slice(0, 8)}`,
          users: {
            connect: { id: user.id },
          },
        },
      });

      // Also create a default subscription for RECRUIT tier
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          tier: 'RECRUIT',
          status: 'active',
        },
      });

      return org;
    }

    // Return first organization (MVP - single org per user for now)
    return user.organizations[0];
  }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
    });

    return org;
  }),
});
