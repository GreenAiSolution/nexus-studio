/**
 * Rate limiting middleware for tRPC
 * Uses Upstash Redis for distributed rate limiting
 */

import { TRPCError } from '@trpc/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default limits by subscription tier
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  RECRUIT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  OPERATOR: {
    windowMs: 60 * 1000,
    maxRequests: 500,
  },
  EMPIRE: {
    windowMs: 60 * 1000,
    maxRequests: 5000,
  },
};

async function redis(command: string, ...args: (string | number)[]): Promise<any> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    // Skip rate limiting if Redis is not configured
    return null;
  }

  const url = new URL(REDIS_URL);
  url.pathname = `/`;

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command, args }),
    });

    if (!response.ok) {
      throw new Error(`Redis error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis is down
    return null;
  }
}

export async function checkRateLimit(
  userId: string,
  tier: string
): Promise<boolean> {
  const config = RATE_LIMIT_CONFIGS[tier];
  if (!config) {
    // Unknown tier, use RECRUIT limits
    return checkRateLimit(userId, 'RECRUIT');
  }

  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old entries outside the window
    await redis('ZREMRANGEBYSCORE', key, 0, windowStart);

    // Count requests in current window
    const count = await redis('ZCARD', key);

    if (count >= config.maxRequests) {
      return false;
    }

    // Add current request
    await redis('ZADD', key, now, `${now}-${Math.random()}`);

    // Set expiration to window size
    await redis('EXPIRE', key, Math.ceil(config.windowMs / 1000));

    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open
    return true;
  }
}

export function createRateLimitMiddleware() {
  return async (
    userId: string,
    tier: string
  ) => {
    const allowed = await checkRateLimit(userId, tier);

    if (!allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }
  };
}

export async function getRateLimitStatus(userId: string, tier: string) {
  const config = RATE_LIMIT_CONFIGS[tier];
  if (!config) {
    return null;
  }

  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    await redis('ZREMRANGEBYSCORE', key, 0, windowStart);
    const count = await redis('ZCARD', key);

    return {
      current: count || 0,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - (count || 0)),
      resetAt: now + config.windowMs,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}
