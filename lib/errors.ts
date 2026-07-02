/**
 * NEXUS AI — Centralized Error Handling
 *
 * Production-grade error handling with proper logging and recovery.
 */

import { TRPCError } from '@trpc/server';

export class NEXUSError extends Error {
  code: string;
  statusCode: number;
  context?: Record<string, any>;

  constructor(message: string, code: string, statusCode: number = 500, context?: Record<string, any>) {
    super(message);
    this.name = 'NEXUSError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

export class AuthenticationError extends NEXUSError {
  constructor(message = 'Authentication failed', context?: Record<string, any>) {
    super(message, 'AUTH_FAILED', 401, context);
  }
}

export class AuthorizationError extends NEXUSError {
  constructor(message = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 'FORBIDDEN', 403, context);
  }
}

export class ValidationError extends NEXUSError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_FAILED', 400, context);
  }
}

export class IntegrationError extends NEXUSError {
  constructor(message: string, integrationName?: string) {
    super(message, 'INTEGRATION_FAILED', 503, { integration: integrationName });
  }
}

export class RateLimitError extends NEXUSError {
  retryAfter: number;

  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 'RATE_LIMITED', 429);
    this.retryAfter = retryAfter;
  }
}

export class ModelError extends NEXUSError {
  constructor(message: string, modelName?: string) {
    super(message, 'MODEL_ERROR', 503, { model: modelName });
  }
}

/**
 * Convert errors to TRPC format
 */
export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof NEXUSError) {
    return new TRPCError({
      code: mapStatusToTRPCCode(error.statusCode),
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof Error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    });
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: String(error),
  });
}

/**
 * Map HTTP status to TRPC error code
 */
function mapStatusToTRPCCode(status: number): any {
  const mapping: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'INTERNAL_SERVER_ERROR',
  };

  return mapping[status] || 'INTERNAL_SERVER_ERROR';
}

/**
 * Safe error logging for sensitive data
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const timestamp = new Date().toISOString();

  let message = 'Unknown error';
  let code = 'UNKNOWN';

  if (error instanceof NEXUSError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  // Log to console (in production, send to Sentry/DataDog)
  console.error(JSON.stringify({
    timestamp,
    level: 'error',
    message,
    code,
    context: sanitizeContext(context),
  }));
}

/**
 * Remove sensitive data from logs
 */
function sanitizeContext(context?: Record<string, any>): Record<string, any> {
  if (!context) return {};

  const sanitized = { ...context };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'key', 'authorization'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}
