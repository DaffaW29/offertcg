import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: true
  });

  return ratelimit;
}

export async function checkRateLimit(identifier: string) {
  const limiter = getRatelimit();
  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: 0 };

  return limiter.limit(identifier);
}
