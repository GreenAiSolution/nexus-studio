/**
 * NEXUS AI — Rate Limiting
 *
 * Token bucket algorithm for API rate limiting.
 * Simple in-memory implementation (for production, use Redis).
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store (in production, use Redis)
const buckets = new Map<string, TokenBucket>();

export interface RateLimitConfig {
  tokensPerWindow: number;
  windowMs: number;
  keyPrefix?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  tokensPerWindow: 1000, // 1000 requests per minute
  windowMs: 60 * 1000,   // 1 minute
  keyPrefix: 'rl:',
};

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const bucketKey = `${finalConfig.keyPrefix}${key}`;

  const now = Date.now();
  let bucket = buckets.get(bucketKey);

  // Initialize or refill bucket
  if (!bucket) {
    bucket = {
      tokens: finalConfig.tokensPerWindow,
      lastRefill: now,
    };
    buckets.set(bucketKey, bucket);
  } else {
    // Calculate tokens to add based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const refillRate = finalConfig.tokensPerWindow / finalConfig.windowMs;
    const tokensToAdd = timePassed * refillRate;

    bucket.tokens = Math.min(
      finalConfig.tokensPerWindow,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;
  }

  // Check if request allowed
  const allowed = bucket.tokens >= 1;

  if (allowed) {
    bucket.tokens -= 1;
  }

  // Calculate reset time
  const timeUntilRefill = (finalConfig.windowMs - (now - bucket.lastRefill)) / 1000;
  const resetAt = Math.ceil(now + (timeUntilRefill * 1000));

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    resetAt,
  };
}

/**
 * Rate limit for organization (lenient)
 */
export function checkOrgRateLimit(
  orgId: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(orgId, {
    tokensPerWindow: 10000, // 10,000 requests/minute per org
    windowMs: 60 * 1000,
  });
}

/**
 * Rate limit for API key (strict)
 */
export function checkApiKeyRateLimit(
  apiKey: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(apiKey, {
    tokensPerWindow: 100, // 100 requests/minute per key
    windowMs: 60 * 1000,
  });
}

/**
 * Rate limit for IP (moderate)
 */
export function checkIpRateLimit(
  ip: string
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(ip, {
    tokensPerWindow: 1000, // 1,000 requests/minute per IP
    windowMs: 60 * 1000,
  });
}

/**
 * Cleanup old buckets (prevent memory leak)
 */
export function cleanupOldBuckets(maxAge: number = 3600000) {
  // Remove buckets older than 1 hour
  const now = Date.now();

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key);
    }
  }
}

// Cleanup every 30 minutes
setInterval(() => cleanupOldBuckets(), 30 * 60 * 1000);
