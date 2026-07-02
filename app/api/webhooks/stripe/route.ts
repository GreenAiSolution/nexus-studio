import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import {
  verifyStripeSignature,
  parseStripeEvent,
  generateIdempotencyKey,
} from '@/lib/integrations/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.warn('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const isValid = verifyStripeSignature(body, signature, signingSecret);

    if (!isValid) {
      console.warn('[Stripe Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    let event;
    try {
      const payload = JSON.parse(body);
      event = parseStripeEvent(payload);
    } catch (error) {
      console.error('[Stripe Webhook] Failed to parse event', error);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    if (!event) {
      console.warn('[Stripe Webhook] Invalid event structure');
      return NextResponse.json(
        { error: 'Invalid event' },
        { status: 400 }
      );
    }

    const idempotencyKey = generateIdempotencyKey(event.id);

    const existingLog = await prisma.auditLog.findFirst({
      where: {
        metadata: {
          contains: idempotencyKey,
        },
      },
    });

    if (existingLog) {
      console.info('[Stripe Webhook] Duplicate event, already processed:', event.id);
      return NextResponse.json({ ok: true, skipped: true });
    }

    const eventId = await inngest.send({
      name: 'stripe/webhook.received',
      data: {
        eventId: event.id,
        eventType: event.type,
        eventTimestamp: event.created,
        payload: event.data.object,
      },
    });

    console.info('[Stripe Webhook] Event queued:', event.id, 'inngest:', eventId);

    return NextResponse.json({ ok: true, eventId });
  } catch (error) {
    console.error('[Stripe Webhook] Unexpected error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
