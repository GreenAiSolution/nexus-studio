/**
 * Slack API client for NEXUS AI
 * Handles message posting, event subscriptions, and team management
 */

/**
 * Post agent result to a Slack thread
 */
export async function postAgentResultToSlack(
  accessToken: string,
  channel: string,
  threadTs: string,
  result: string,
  modelUsed: string,
  tokensUsed: number,
  costUSD: number
): Promise<{ ok: boolean; timestamp?: string; error?: string }> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        thread_ts: threadTs,
        text: result,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Agent Response*\n${result}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Model: ${modelUsed} | Tokens: ${tokensUsed} | Cost: $${costUSD.toFixed(4)}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.ok) {
      return {
        ok: false,
        error: `Slack API error: ${data.error}`,
      };
    }

    return {
      ok: true,
      timestamp: data.ts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user info from Slack (for audit logging)
 */
export async function getSlackUserInfo(
  accessToken: string,
  userId: string
): Promise<{ ok: boolean; user?: { id: string; name: string; email?: string }; error?: string }> {
  try {
    const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.ok) {
      return {
        ok: false,
        error: `Slack API error: ${data.error}`,
      };
    }

    return {
      ok: true,
      user: {
        id: data.user.id,
        name: data.user.name || data.user.real_name || 'Unknown',
        email: data.user.profile?.email,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * List all channels the bot is a member of
 */
export async function listSlackChannels(
  accessToken: string
): Promise<{ ok: boolean; channels?: Array<{ id: string; name: string }>; error?: string }> {
  try {
    const response = await fetch('https://slack.com/api/conversations.list?limit=100', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.ok) {
      return {
        ok: false,
        error: `Slack API error: ${data.error}`,
      };
    }

    const channels = (data.channels || [])
      .filter((ch: any) => !ch.is_archived)
      .map((ch: any) => ({
        id: ch.id,
        name: ch.name,
      }));

    return {
      ok: true,
      channels,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify Slack webhook signature
 */
export function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  signature: string,
  body: string
): boolean {
  const crypto = require('crypto');

  // Check if timestamp is within 5 minutes (anti-replay)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(baseString);
  const calculatedSignature = `v0=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}

/**
 * Parse Slack event payload
 */
export interface SlackEvent {
  type: 'url_verification' | 'event_callback';
  challenge?: string;
  event?: {
    type: string;
    user?: string;
    text?: string;
    channel?: string;
    thread_ts?: string;
    ts?: string;
  };
}

export function parseSlackPayload(payload: unknown): SlackEvent | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const obj = payload as Record<string, unknown>;

  return {
    type: obj.type as SlackEvent['type'],
    challenge: obj.challenge as string | undefined,
    event: obj.event as SlackEvent['event'] | undefined,
  };
}

/**
 * Handle Slack slash command
 */
export async function handleSlackSlashCommand(
  accessToken: string,
  responseUrl: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_type: 'in_channel',
        text: `Processing: ${text}`,
      }),
    });

    return {
      ok: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: errorMessage,
    };
  }
}
