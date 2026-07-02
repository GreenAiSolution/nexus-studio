import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import {
  verifySlackSignature,
  parseSlackPayload,
} from '@/lib/integrations/slack';
import { prisma } from '@/lib/db';

/**
 * Slack Events API Webhook
 * Receives message events and routes to agent execution
 */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error('[Slack Events] Missing SLACK_SIGNING_SECRET');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const timestamp = req.headers.get('x-slack-request-timestamp') || '';
    const signature = req.headers.get('x-slack-signature') || '';

    // Verify signature
    const isValid = verifySlackSignature(signingSecret, timestamp, signature, body);

    if (!isValid) {
      console.warn('[Slack Events] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('[Slack Events] Failed to parse payload', error);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const event = parseSlackPayload(payload);

    if (!event) {
      console.warn('[Slack Events] Invalid event structure');
      return NextResponse.json(
        { error: 'Invalid event' },
        { status: 400 }
      );
    }

    // Handle Slack URL verification
    if (event.type === 'url_verification') {
      console.info('[Slack Events] URL verification challenge');
      return NextResponse.json({
        challenge: event.challenge,
      });
    }

    // Handle message events
    if (event.type === 'event_callback' && event.event) {
      const slackEvent = event.event;

      // Only handle message events
      if (slackEvent.type === 'message' && slackEvent.text && slackEvent.user) {

        // Find Slack integration by workspace
        // In production, you'd extract the workspace ID from the token
        const integration = await prisma.integration.findFirst({
          where: {
            provider: 'SLACK',
            isActive: true,
          },
          include: {
            organization: {
              include: { agents: { where: { status: 'ACTIVE' } } },
            },
          },
        });

        if (!integration || !integration.organization.agents.length) {
          console.warn('[Slack Events] No active Slack integration or agents found');
          return NextResponse.json({ ok: true, reason: 'no_integration' });
        }

        // Get the default agent (first active agent)
        const agent = integration.organization.agents[0];

        // Trigger agent task execution
        const taskId = await inngest.send({
          name: 'task/execute.requested',
          data: {
            organizationId: integration.organization.id,
            agentId: agent.id,
            taskId: `slack:${slackEvent.ts}`, // Use Slack timestamp as task ID
            prompt: slackEvent.text,
            priority: 1, // High priority for interactive messages
            timeoutMs: 30000, // 30 second timeout for Slack
            slackChannel: slackEvent.channel,
            slackThreadTs: slackEvent.thread_ts || slackEvent.ts,
            slackUserId: slackEvent.user,
            slackIntegrationId: integration.id,
          },
        });

        console.info('[Slack Events] Task queued:', taskId, 'from:', slackEvent.user);

        return NextResponse.json({ ok: true, taskId });
      }
    }

    // Ignore other event types
    return NextResponse.json({ ok: true, reason: 'unhandled_event_type' });
  } catch (error) {
    console.error('[Slack Events] Unexpected error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
