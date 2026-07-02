import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOAuthUrl } from '@/lib/integrations/oauth';
import { inngest } from '@/inngest/client';

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger OAuth start via Inngest to generate state
    const result = await inngest.send({
      name: 'integrations/oauth.start.requested',
      data: {
        organizationId: orgId,
        provider: 'SALESFORCE',
        userId,
      },
    });

    // For now, generate state directly (Inngest is async)
    // In production, you'd wait for the Inngest function result or use a different pattern
    const crypto = require('crypto');
    const state = crypto.randomBytes(32).toString('hex');

    // Get OAuth URL
    const oauthUrl = getOAuthUrl('salesforce', state);

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('[Salesforce OAuth Start Error]', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}
