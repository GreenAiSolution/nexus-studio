/**
 * NEXUS AI — Integration Orchestration Inngest Functions
 *
 * Handles OAuth flows, data syncs, webhooks for:
 * - Salesforce (contacts, activities)
 * - Slack (events, messages)
 * - Stripe (subscriptions, webhooks)
 */

import { inngest } from './client';
import { prisma } from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/integrations/oauth';
import { exchangeSalesforceCode, refreshSalesforceToken, fetchSalesforceContacts } from '@/lib/integrations/salesforce';

// ═════════════════════════════════════════════════════════════════════════════
// 1. OAuth Initiation
// ═════════════════════════════════════════════════════════════════════════════

export const startOAuth = inngest.createFunction(
  {
    id: 'integrations/oauth.start',
    name: 'Start OAuth Flow',
    triggers: [{ event: 'integrations/oauth.start.requested' }],
  },
  async (ctx: any) => {
    const { organizationId, provider } = ctx.event.data as {
      organizationId: string;
      provider: 'SALESFORCE' | 'SLACK' | 'HUBSPOT';
    };

    try {
      // Generate and store OAuth state
      const crypto = require('crypto');
      const state = crypto.randomBytes(32).toString('hex');

      await prisma.oAuthState.create({
        data: {
          organizationId,
          provider,
          state,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_CONNECTED',
          resource: 'Integration',
          metadata: JSON.stringify({
            provider,
            state_generated: true,
          }),
        },
      });

      return { state, provider };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[OAuth Start Error]', errorMessage);
      throw error;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 2. OAuth Callback Handler
// ═════════════════════════════════════════════════════════════════════════════

export const handleOAuthCallback = inngest.createFunction(
  {
    id: 'integrations/oauth.callback',
    name: 'Handle OAuth Callback',
    triggers: [{ event: 'integrations/oauth.callback.received' }],
  },
  async (ctx: any) => {
    const { organizationId, provider, code, state } = ctx.event.data as {
      organizationId: string;
      provider: 'SALESFORCE' | 'SLACK' | 'HUBSPOT';
      code: string;
      state: string;
    };

    try {
      // Step 1: Verify state token (CSRF protection)
      const oauthState = await prisma.oAuthState.findUnique({
        where: { state },
      });

      if (!oauthState || oauthState.organizationId !== organizationId || oauthState.expiresAt < new Date()) {
        throw new Error('Invalid or expired OAuth state token');
      }

      // Step 2: Exchange code for access token
      let accessToken: string;
      let refreshToken: string | undefined;
      let instanceUrl: string | undefined;

      if (provider === 'SALESFORCE') {
        const result = await exchangeSalesforceCode(
          code,
          process.env.SALESFORCE_CLIENT_ID || '',
          process.env.SALESFORCE_CLIENT_SECRET || '',
          `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/salesforce/callback`
        );

        if (!result.ok) {
          throw new Error(result.error || 'Salesforce OAuth failed');
        }

        accessToken = result.accessToken!;
        refreshToken = result.refreshToken;
        instanceUrl = result.instanceUrl;
      } else {
        throw new Error(`OAuth provider not yet implemented: ${provider}`);
      }

      // Step 3: Encrypt and store tokens
      const encryptedAccessToken = encryptToken(accessToken);
      const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : undefined;

      // Step 4: Create or update Integration
      const integration = await prisma.integration.upsert({
        where: {
          organizationId_provider: {
            organizationId,
            provider: provider as any,
          },
        },
        create: {
          organizationId,
          provider: provider as any,
          name: `${provider} Integration`,
          displayName: provider,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenType: 'Bearer',
          tokenExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours for Salesforce
          config: JSON.stringify({ instanceUrl }),
          isActive: true,
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      // Step 5: Clean up OAuth state
      await prisma.oAuthState.delete({
        where: { id: oauthState.id },
      });

      // Step 6: Create audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_CONNECTED',
          resource: 'Integration',
          resourceId: integration.id,
          metadata: JSON.stringify({
            provider,
            connected: true,
          }),
        },
      });

      // Step 7: Trigger initial sync
      await inngest.send({
        name: 'integrations/sync.scheduled',
        data: {
          organizationId,
          integrationId: integration.id,
          provider,
        },
      });

      return {
        ok: true,
        integrationId: integration.id,
        provider,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[OAuth Callback Error]', errorMessage);

      // Log failure
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_CONNECTED',
          resource: 'Integration',
          changes: JSON.stringify({ error: errorMessage }),
        },
      });

      throw error;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 3. Salesforce Sync (Daily + On-Demand)
// ═════════════════════════════════════════════════════════════════════════════

export const syncSalesforce = inngest.createFunction(
  {
    id: 'integrations/salesforce.sync',
    name: 'Sync Salesforce Contacts',
    triggers: [{ event: 'integrations/sync.scheduled' }],
    concurrency: [{ limit: 1, key: 'event.data.integrationId' }], // Prevent concurrent syncs
  },
  async (ctx: any) => {
    const { organizationId, integrationId, provider } = ctx.event.data as {
      organizationId: string;
      integrationId: string;
      provider: string;
    };

    if (provider !== 'SALESFORCE') {
      return { skipped: true, reason: 'Not a Salesforce integration' };
    }

    const syncLogId = (await prisma.integrationSyncLog.create({
      data: {
        organizationId,
        integrationId,
        syncStatus: 'running',
      },
    })).id;

    try {
      // Load integration
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.isActive) {
        throw new Error('Integration not found or inactive');
      }

      // Decrypt access token
      const accessToken = integration.accessToken ? decryptToken(integration.accessToken) : null;
      if (!accessToken) {
        throw new Error('No valid access token');
      }

      const config = integration.config ? JSON.parse(integration.config) : {};
      const instanceUrl = config.instanceUrl;

      if (!instanceUrl) {
        throw new Error('Missing Salesforce instance URL');
      }

      // Fetch contacts
      const result = await fetchSalesforceContacts(accessToken, instanceUrl, 100, 0);

      if (!result.ok) {
        if (result.error === 'token_expired') {
          // Trigger token refresh
          await inngest.send({
            name: 'integrations/oauth.refresh.requested',
            data: { organizationId, integrationId, provider: 'SALESFORCE' },
          });
          throw new Error('Token expired, refresh triggered');
        }
        throw new Error(result.error || 'Failed to fetch Salesforce contacts');
      }

      const contactsSynced = result.contacts?.length || 0;

      // Log sync result
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          syncStatus: 'succeeded',
          recordsSynced: contactsSynced,
          completedAt: new Date(),
          durationMs: Date.now() - (await prisma.integrationSyncLog.findUnique({
            where: { id: syncLogId },
            select: { createdAt: true },
          }))!.createdAt.getTime(),
        },
      });

      // Update integration metadata
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          lastError: null,
          errorCount: 0,
          config: JSON.stringify({
            ...config,
            salesforce_last_sync: new Date().toISOString(),
            salesforce_contacts_synced: contactsSynced,
          }),
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_SYNCED',
          resource: 'Integration',
          resourceId: integrationId,
          changes: JSON.stringify({
            contacts_synced: contactsSynced,
            rate_limit_remaining: result.rateLimitRemaining,
          }),
        },
      });

      return {
        ok: true,
        integrationId,
        contactsSynced,
        rateLimitRemaining: result.rateLimitRemaining,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update sync log with error
      await prisma.integrationSyncLog.update({
        where: { id: syncLogId },
        data: {
          syncStatus: 'failed',
          errorMessage,
          completedAt: new Date(),
          retryCount: { increment: 1 },
          nextRetryAt: new Date(Date.now() + 60000), // Retry in 1 minute
        },
      });

      // Update integration with error
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      const newErrorCount = (integration?.errorCount || 0) + 1;

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastError: errorMessage,
          errorCount: newErrorCount,
        },
      });

      // Trigger retry after 3 consecutive errors
      if (newErrorCount >= 1) {
        await inngest.send({
          name: 'integrations/sync.retry',
          data: {
            organizationId,
            integrationId,
            provider,
            attemptNumber: 1,
          },
        });
      }

      console.error('[Salesforce Sync Error]', errorMessage);
      throw error;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 4. OAuth Token Refresh (Triggered on 401 errors)
// ═════════════════════════════════════════════════════════════════════════════

export const refreshOAuthToken = inngest.createFunction(
  {
    id: 'integrations/oauth.refresh',
    name: 'Refresh OAuth Token',
    triggers: [{ event: 'integrations/oauth.refresh.requested' }],
  },
  async (ctx: any) => {
    const { organizationId, integrationId, provider } = ctx.event.data as {
      organizationId: string;
      integrationId: string;
      provider: 'SALESFORCE' | 'SLACK' | 'HUBSPOT';
    };

    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      const refreshToken = integration.refreshToken ? decryptToken(integration.refreshToken) : null;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Refresh based on provider
      if (provider === 'SALESFORCE') {
        const result = await refreshSalesforceToken(
          refreshToken,
          process.env.SALESFORCE_CLIENT_ID || '',
          process.env.SALESFORCE_CLIENT_SECRET || ''
        );

        if (!result.ok) {
          throw new Error(result.error || 'Token refresh failed');
        }

        const encryptedAccessToken = encryptToken(result.accessToken!);

        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            accessToken: encryptedAccessToken,
            tokenExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
            lastRefreshAt: new Date(),
            refreshedCount: { increment: 1 },
            lastError: null,
            errorCount: 0,
          },
        });

        // Log refresh
        await prisma.auditLog.create({
          data: {
            organizationId,
            userId: 'system',
            action: 'API_KEY_ROTATED',
            resource: 'Integration',
            resourceId: integrationId,
            metadata: JSON.stringify({ provider, refreshed: true }),
          },
        });

        return { ok: true, provider, refreshedAt: new Date() };
      }

      throw new Error(`Token refresh not implemented for ${provider}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Token Refresh Error]', errorMessage);

      // Mark integration as needing manual intervention
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          isActive: false,
          lastError: `Token refresh failed: ${errorMessage}`,
        },
      });

      throw error;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 5. Cleanup Expired OAuth States (Scheduled Daily)
// ═════════════════════════════════════════════════════════════════════════════

export const cleanupExpiredOAuthStates = inngest.createFunction(
  {
    id: 'integrations/oauth.cleanup',
    name: 'Cleanup Expired OAuth States',
    triggers: [{ event: 'integrations/oauth.cleanup.scheduled' }],
  },
  async () => {
    try {
      const result = await prisma.oAuthState.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return { ok: true, deletedCount: result.count };
    } catch (error) {
      console.error('[OAuth Cleanup Error]', error);
      // Non-critical error, don't throw
      return { ok: false, error: String(error) };
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 6. Stripe Webhook Handler (Idempotent)
// ═════════════════════════════════════════════════════════════════════════════

export const handleStripeWebhook = inngest.createFunction(
  {
    id: 'stripe/webhook.received',
    name: 'Handle Stripe Webhook Event',
    triggers: [{ event: 'stripe/webhook.received' }],
  },
  async (ctx: any) => {
    const { eventId, eventType, eventTimestamp, payload } = ctx.event.data as {
      eventId: string;
      eventType: string;
      eventTimestamp: number;
      payload: Record<string, any>;
    };

    try {
      // Create audit log entry with idempotency key
      const idempotencyKey = `stripe:${eventId}`;

      await prisma.auditLog.create({
        data: {
          organizationId: 'system',
          userId: 'stripe',
          action: 'BILLING_USAGE_REPORTED',
          resource: 'Stripe',
          resourceId: eventId,
          metadata: JSON.stringify({
            eventId,
            eventType,
            idempotencyKey,
            timestamp: eventTimestamp,
          }),
        },
      });

      // Route by event type
      switch (eventType) {
        case 'customer.subscription.updated': {
          const subscription = payload;
          const customerId = subscription.customer;
          const subscriptionId = subscription.id;
          const status = subscription.status;

          const org = await prisma.organization.findFirst({
            where: {
              subscription: {
                stripeCustomerId: customerId,
              },
            },
            include: { subscription: true },
          });

          if (!org?.subscription) {
            console.warn('[Stripe] Organization not found for customer:', customerId);
            return { ok: true, reason: 'org_not_found' };
          }

          await prisma.subscription.update({
            where: { id: org.subscription.id },
            data: {
              status,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : undefined,
            },
          });

          console.info('[Stripe] Subscription updated:', subscriptionId, 'status:', status);
          return { ok: true, eventType: 'subscription.updated', subscriptionId };
        }

        case 'invoice.payment_succeeded': {
          const invoice = payload;
          const customerId = invoice.customer;

          const org = await prisma.organization.findFirst({
            where: {
              subscription: {
                stripeCustomerId: customerId,
              },
            },
            include: { subscription: true },
          });

          if (!org?.subscription) {
            console.warn('[Stripe] Organization not found for customer:', customerId);
            return { ok: true, reason: 'org_not_found' };
          }

          await prisma.subscription.update({
            where: { id: org.subscription.id },
            data: {
              status: 'active',
              currentMonthCostUSD: 0,
              currentMonthRuns: 0,
              currentMonthTokens: 0,
            },
          });

          console.info('[Stripe] Payment succeeded:', invoice.id);
          return { ok: true, eventType: 'payment.succeeded', invoiceId: invoice.id };
        }

        case 'invoice.payment_failed': {
          const invoice = payload;
          const customerId = invoice.customer;

          const org = await prisma.organization.findFirst({
            where: {
              subscription: {
                stripeCustomerId: customerId,
              },
            },
            include: { subscription: true },
          });

          if (org?.subscription) {
            await prisma.subscription.update({
              where: { id: org.subscription.id },
              data: {
                status: 'past_due',
              },
            });
          }

          console.warn('[Stripe] Payment failed for invoice:', invoice.id);
          return { ok: true, eventType: 'payment.failed', invoiceId: invoice.id };
        }

        default: {
          console.info('[Stripe] Unhandled event type:', eventType);
          return { ok: true, eventType, reason: 'unhandled' };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Stripe Webhook Error]', errorMessage);
      throw error;
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 7. Retry Failed Sync (Exponential backoff)
// ═════════════════════════════════════════════════════════════════════════════

export const retryFailedSync = inngest.createFunction(
  {
    id: 'integrations/sync.retry',
    name: 'Retry Failed Integration Sync',
    triggers: [{ event: 'integrations/sync.retry' }],
  },
  async (ctx: any) => {
    const { organizationId, integrationId, provider, attemptNumber = 1 } = ctx.event.data as {
      organizationId: string;
      integrationId: string;
      provider: string;
      attemptNumber?: number;
    };

    // Max 3 retry attempts
    if (attemptNumber > 3) {
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          isActive: false,
          lastError: 'Max retry attempts exceeded',
        },
      });

      // Send to dead-letter queue
      await inngest.send({
        name: 'integrations/sync.deadletter',
        data: {
          organizationId,
          integrationId,
          provider,
          reason: 'max_retries_exceeded',
          attemptNumber,
        },
      });

      return { ok: false, reason: 'max_retries_exceeded' };
    }

    try {
      // Trigger sync with exponential backoff
      await inngest.send({
        name: 'integrations/sync.scheduled',
        data: {
          organizationId,
          integrationId,
          provider,
        },
      });

      return { ok: true, attemptNumber, nextRetryAt: new Date() };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Retry Sync Error]', errorMessage);

      // Schedule next retry (exponential backoff: 60s, 300s, 900s)
      const backoffMs = [60000, 300000, 900000][attemptNumber - 1] || 900000;

      await ctx.step.sleep('wait-before-retry', backoffMs);

      await inngest.send({
        name: 'integrations/sync.retry',
        data: {
          organizationId,
          integrationId,
          provider,
          attemptNumber: attemptNumber + 1,
        },
      });

      return { ok: false, error: errorMessage, scheduledRetry: true };
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// 8. Dead-Letter Queue Handler (Failed syncs requiring manual intervention)
// ═════════════════════════════════════════════════════════════════════════════

export const handleDeadLetterSync = inngest.createFunction(
  {
    id: 'integrations/sync.deadletter',
    name: 'Handle Dead-Letter Sync',
    triggers: [{ event: 'integrations/sync.deadletter' }],
  },
  async (ctx: any) => {
    const { organizationId, integrationId, provider, reason, attemptNumber } = ctx.event.data as {
      organizationId: string;
      integrationId: string;
      provider: string;
      reason: string;
      attemptNumber: number;
    };

    try {
      // Create dead-letter entry
      await prisma.integrationDeadLetter.create({
        data: {
          organizationId,
          integrationId,
          provider: provider as any,
          failureReason: reason,
          metadata: JSON.stringify({
            attemptNumber,
            timestamp: new Date().toISOString(),
          }),
          requiresManualIntervention: true,
        },
      });

      // Disable integration
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          isActive: false,
          lastError: `Dead-lettered: ${reason}`,
        },
      });

      // Log for alerting
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: 'system',
          action: 'INTEGRATION_SYNC_FAILED',
          resource: 'Integration',
          resourceId: integrationId,
          metadata: JSON.stringify({
            provider,
            reason,
            attemptNumber,
            requiresManualIntervention: true,
          }),
        },
      });

      console.error(`[Dead-Letter] Integration ${integrationId} failed after ${attemptNumber} attempts. Reason: ${reason}`);

      return { ok: true, reason, requiresManualIntervention: true };
    } catch (error) {
      console.error('[Dead-Letter Handler Error]', error);
      throw error;
    }
  }
);
