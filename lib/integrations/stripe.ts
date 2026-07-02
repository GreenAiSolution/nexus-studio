/**
 * Stripe webhook handler for NEXUS AI
 * Handles subscription events, payments, and billing updates
 */

import crypto from 'crypto';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
}

/**
 * Verify Stripe webhook signature
 * Ensures webhook came from Stripe and hasn't been tampered with
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  signingSecret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(`v1=${computedSignature}`),
    Buffer.from(signature)
  );
}

/**
 * Parse and validate Stripe webhook event
 */
export function parseStripeEvent(payload: unknown): StripeWebhookEvent | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const event = payload as Record<string, any>;

  if (!event.id || !event.type || !event.data) {
    return null;
  }

  return {
    id: event.id,
    type: event.type,
    created: event.created,
    data: event.data,
  };
}

/**
 * Get subscription tier from Stripe price ID
 */
export function getTierFromPriceId(priceId: string): string | null {
  // Map Stripe price IDs to tiers
  // In production, these would be stored in environment variables or database
  const tierMap: Record<string, string> = {
    // RECRUIT - $97/month
    [process.env.STRIPE_PRICE_RECRUIT || '']: 'RECRUIT',
    // OPERATOR - $497/month
    [process.env.STRIPE_PRICE_OPERATOR || '']: 'OPERATOR',
    // EMPIRE - $2,497/month
    [process.env.STRIPE_PRICE_EMPIRE || '']: 'EMPIRE',
  };

  return tierMap[priceId] || null;
}

/**
 * Extract subscription info from Stripe event
 */
export function extractSubscriptionInfo(event: StripeWebhookEvent): {
  customerId: string;
  subscriptionId: string;
  status: string;
  tier?: string;
  currentPeriodEnd?: number;
} | null {
  const subscription = event.data.object;

  if (!subscription.customer || !subscription.id) {
    return null;
  }

  let tier: string | undefined;

  // Get tier from items array
  if (subscription.items?.data && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price?.id;
    if (priceId) {
      const extractedTier = getTierFromPriceId(priceId);
      if (extractedTier) {
        tier = extractedTier;
      }
    }
  }

  return {
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    status: subscription.status,
    tier,
    currentPeriodEnd: subscription.current_period_end,
  };
}

/**
 * Extract payment info from Stripe invoice event
 */
export function extractPaymentInfo(event: StripeWebhookEvent): {
  customerId: string;
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paid: boolean;
  failed: boolean;
} | null {
  const invoice = event.data.object;

  if (!invoice.customer || !invoice.id) {
    return null;
  }

  return {
    customerId: invoice.customer,
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription || '',
    amount: invoice.amount_paid || invoice.amount_due || 0,
    currency: invoice.currency || 'usd',
    paid: invoice.paid || false,
    failed: invoice.status === 'draft' || !invoice.paid,
  };
}

/**
 * Generate idempotency key for Stripe events
 * Used to prevent duplicate processing
 */
export function generateIdempotencyKey(eventId: string): string {
  return `stripe:${eventId}`;
}
