import { initTRPC, TRPCError } from '@trpc/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

type Context = {
  userId: string | null;
  orgId: string | null;
};

export const createContext = async (): Promise<Context> => {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      orgId: null,
    };
  }

  try {
    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organizations: { take: 1 } },
    });

    if (!user) {
      const clerkUser = await currentUser();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || `user-${userId.slice(0, 8)}@clerk.local`,
          name: clerkUser?.fullName || clerkUser?.firstName || undefined,
        },
        include: { organizations: true },
      });
    }

    // If user has no org, create one
    if (!user.organizations || user.organizations.length === 0) {
      const org = await prisma.organization.create({
        data: {
          name: 'My Organization',
          slug: `org-${userId.slice(0, 8)}`,
          users: { connect: { id: user.id } },
        },
      });

      // Create default subscription
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          tier: 'RECRUIT',
          status: 'active',
        },
      });

      return {
        userId,
        orgId: org.id,
      };
    }

    return {
      userId,
      orgId: user.organizations[0].id,
    };
  } catch (error) {
    console.error('[tRPC Context Error]', error);
    return {
      userId,
      orgId: null,
    };
  }
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.orgId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userId: ctx.userId,
      orgId: ctx.orgId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
