/**
 * Audit logging utility for tracking sensitive operations
 */

import { prisma } from './db';
import { AuditAction } from '@prisma/client';

interface AuditLogContext {
  organizationId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogEntry {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(
  context: AuditLogContext,
  entry: AuditLogEntry
) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging shouldn't break the app
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs for an organization with pagination
 */
export async function getAuditLogs(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    userId?: string;
    resourceId?: string;
  }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: any = { organizationId };
  if (options?.action) where.action = options.action;
  if (options?.userId) where.userId = options.userId;
  if (options?.resourceId) where.resourceId = options.resourceId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
    total,
    limit,
    offset,
  };
}

/**
 * Helper functions for common audit events
 */

export async function logAgentCreated(
  context: AuditLogContext,
  agentId: string,
  agentName: string,
  metadata?: Record<string, any>
) {
  return logAuditEvent(context, {
    action: 'AGENT_CREATED',
    resource: 'Agent',
    resourceId: agentId,
    metadata: { agentName, ...metadata },
  });
}

export async function logAgentUpdated(
  context: AuditLogContext,
  agentId: string,
  changes: Record<string, any>
) {
  return logAuditEvent(context, {
    action: 'AGENT_UPDATED',
    resource: 'Agent',
    resourceId: agentId,
    changes,
  });
}

export async function logIntegrationConnected(
  context: AuditLogContext,
  integrationId: string,
  provider: string
) {
  return logAuditEvent(context, {
    action: 'INTEGRATION_CONNECTED',
    resource: 'Integration',
    resourceId: integrationId,
    metadata: { provider },
  });
}

export async function logIntegrationDisconnected(
  context: AuditLogContext,
  integrationId: string,
  provider: string
) {
  return logAuditEvent(context, {
    action: 'INTEGRATION_DISCONNECTED',
    resource: 'Integration',
    resourceId: integrationId,
    metadata: { provider },
  });
}

export async function logSubscriptionChanged(
  context: AuditLogContext,
  subscriptionId: string,
  action: 'SUBSCRIPTION_UPGRADED' | 'SUBSCRIPTION_DOWNGRADED' | 'SUBSCRIPTION_CANCELED',
  fromTier?: string,
  toTier?: string
) {
  return logAuditEvent(context, {
    action,
    resource: 'Subscription',
    resourceId: subscriptionId,
    metadata: { fromTier, toTier },
  });
}

export async function logTaskExecuted(
  context: AuditLogContext,
  taskId: string,
  agentId: string,
  status: 'success' | 'failed'
) {
  return logAuditEvent(context, {
    action: 'TASK_EXECUTED',
    resource: 'Task',
    resourceId: taskId,
    metadata: { agentId, status },
  });
}

export async function logUserLogin(
  context: AuditLogContext
) {
  return logAuditEvent(context, {
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: context.userId,
  });
}

export async function logApiKeyCreated(
  context: AuditLogContext,
  apiKeyId: string,
  name: string
) {
  return logAuditEvent(context, {
    action: 'API_KEY_CREATED',
    resource: 'ApiKey',
    resourceId: apiKeyId,
    metadata: { name },
  });
}

export async function logApiKeyDeleted(
  context: AuditLogContext,
  apiKeyId: string
) {
  return logAuditEvent(context, {
    action: 'API_KEY_DELETED',
    resource: 'ApiKey',
    resourceId: apiKeyId,
  });
}
