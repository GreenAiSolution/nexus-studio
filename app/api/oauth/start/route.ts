import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateOAuthState, getOAuthUrl } from '@/lib/integrations/oauth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const provider = req.nextUrl.searchParams.get('provider') as
    | 'google'
    | 'slack'
    | 'salesforce'
    | 'hubspot'
    | null;

  if (!provider || !['google', 'slack', 'salesforce', 'hubspot'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  try {
    // Generate state for CSRF protection
    const state = generateOAuthState();

    // Store state in database for verification
    await prisma.apiKey.create({
      data: {
        organizationId: orgId,
        key: state,
        name: `oauth_state_${provider}_${Date.now()}`,
      },
    });

    // Get OAuth URL
    const oauthUrl = getOAuthUrl(provider, state);

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error(`OAuth start error for ${provider}:`, error);
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 });
  }
}
