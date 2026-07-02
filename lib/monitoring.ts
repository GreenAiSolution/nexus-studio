/**
 * Sentry error tracking and performance monitoring setup
 */

import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  const extra = context ? { context } : undefined;
  Sentry.captureException(error, { extra });
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'info',
  context?: Record<string, unknown>
) {
  const extra = context ? { context } : undefined;
  Sentry.captureMessage(message, { level, extra });
}

export async function captureAgentExecution(
  taskId: string,
  agentId: string,
  fn: () => Promise<any>
) {
  try {
    const result = await fn();
    Sentry.captureMessage(`Agent task completed: ${taskId}`, {
      level: 'info',
      extra: { taskId, agentId },
    });
    return result;
  } catch (error) {
    captureException(error, {
      taskId,
      agentId,
      operation: 'agent.execute',
    });
    throw error;
  }
}

export async function captureAPICall(
  operation: string,
  fn: () => Promise<any>,
  metadata?: Record<string, unknown>
) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    captureException(error, {
      operation,
      ...metadata,
    });
    throw error;
  }
}

export function setUserContext(userId: string, orgId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: `org_${orgId}`,
  });

  Sentry.setTag('organization_id', orgId);
}

export function clearUserContext() {
  Sentry.setUser(null);
}
