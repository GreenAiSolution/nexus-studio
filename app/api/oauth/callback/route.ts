import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { exchangeOAuthCode, encryptToken } from '@/lib/integrations/oauth';
import { IntegrationProvider } from '@prisma/client';

type OAuthProvider = 'google' | 'slack' | 'salesforce' | 'hubspot';

const providerMap: Record<string, IntegrationProvider> = {
  google: 'GOOGLE_WORKSPACE',
  slack: 'SLACK',
  salesforce: 'SALESFORCE',
  hubspot: 'HUBSPOT',
};

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.redirect('/sign-in');
  }

  const provider = req.nextUrl.searchParams.get('provider') as OAuthProvider;
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  if (!provider || !['google', 'slack', 'salesforce', 'hubspot'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  if (error) {
    return NextResponse.redirect(`/dashboard/integrations?error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken } = await exchangeOAuthCode(provider, code);

    // Check if integration already exists
    const providerEnum = providerMap[provider] as IntegrationProvider;
    const existing = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId: orgId,
          provider: providerEnum,
        },
      },
    });

    if (existing) {
      // Update existing integration
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptToken(accessToken),
          refreshToken: refreshToken ? encryptToken(refreshToken) : existing.refreshToken,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });
    } else {
      // Create new integration
      await prisma.integration.create({
        data: {
          organizationId: orgId,
          provider: providerEnum,
          name: `${provider} Connection`,
          displayName: `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
          accessToken: encryptToken(accessToken),
          refreshToken: refreshToken ? encryptToken(refreshToken) : undefined,
          isActive: true,
        },
      });
    }

    return NextResponse.redirect(`/dashboard/integrations?success=${provider}`);
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    return NextResponse.redirect(`/dashboard/integrations?error=oauth_failed`);
  }
}
