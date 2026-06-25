type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: Date;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export const AUTH_RATE_LIMIT_RULES = {
  login: { limit: 8, windowSeconds: 10 * 60 },
  register: { limit: 5, windowSeconds: 30 * 60 },
  forgotPassword: { limit: 5, windowSeconds: 30 * 60 },
  resetPassword: { limit: 5, windowSeconds: 30 * 60 },
  verifyEmail: { limit: 10, windowSeconds: 30 * 60 },
  resendVerification: { limit: 3, windowSeconds: 30 * 60 }
} satisfies Record<string, RateLimitRule>;

const globalForRateLimit = globalThis as unknown as {
  __iatronRateLimit?: Map<string, Bucket>;
};

function memoryStore() {
  if (!globalForRateLimit.__iatronRateLimit) globalForRateLimit.__iatronRateLimit = new Map();
  return globalForRateLimit.__iatronRateLimit;
}

export function normalizeRateLimitPart(value: string | null | undefined) {
  return (value ?? "anonymous").trim().toLowerCase().replace(/[^a-z0-9@._:-]/g, "_").slice(0, 160) || "anonymous";
}

export function buildRateLimitKey(route: keyof typeof AUTH_RATE_LIMIT_RULES, ip: string, identifier?: string) {
  return ["auth", route, normalizeRateLimitPart(ip), normalizeRateLimitPart(identifier)].join(":");
}

async function checkRedisLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `rl:${key}`;
  const increment = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!increment.ok) return null;

  const payload = (await increment.json()) as { result?: number };
  const count = Number(payload.result ?? 1);
  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${rule.windowSeconds}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  }

  const retryAfter = rule.windowSeconds;
  return {
    allowed: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - count, 0),
    retryAfter,
    resetAt: new Date(Date.now() + retryAfter * 1000)
  };
}

function checkMemoryLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const store = memoryStore();
  const existing = store.get(key);
  const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + rule.windowSeconds * 1000;
  const count = existing && existing.resetAt > now ? existing.count + 1 : 1;
  store.set(key, { count, resetAt });

  const retryAfter = Math.max(Math.ceil((resetAt - now) / 1000), 1);
  return {
    allowed: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - count, 0),
    retryAfter,
    resetAt: new Date(resetAt)
  };
}

export async function checkRateLimit(route: keyof typeof AUTH_RATE_LIMIT_RULES, ip: string, identifier?: string) {
  const rule = AUTH_RATE_LIMIT_RULES[route];
  const key = buildRateLimitKey(route, ip, identifier);
  const redisResult = await checkRedisLimit(key, rule);
  if (redisResult) return redisResult;

  if (process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK !== "true") {
    return {
      allowed: false,
      limit: rule.limit,
      remaining: 0,
      retryAfter: 60,
      resetAt: new Date(Date.now() + 60_000)
    };
  }

  return checkMemoryLimit(key, rule);
}

export function resetInMemoryRateLimitsForTests() {
  memoryStore().clear();
}
