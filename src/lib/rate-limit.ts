// Simple in-memory token-bucket rate limiter.
// Adequate for one Node process / dev. For multi-instance prod, swap for Redis.

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const refillPerMs = config.max / config.windowMs;
  const existing = buckets.get(key);
  const bucket: Bucket = existing
    ? {
        tokens: Math.min(
          config.max,
          existing.tokens + (now - existing.updatedAt) * refillPerMs,
        ),
        updatedAt: now,
      }
    : { tokens: config.max, updatedAt: now };

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + Math.ceil((1 - bucket.tokens) / refillPerMs),
    };
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetAt: now + config.windowMs,
  };
}

export function rateLimitKey(req: Request, scope: string, userId?: string): string {
  if (userId) return `${scope}:user:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon";
  return `${scope}:ip:${ip}`;
}
