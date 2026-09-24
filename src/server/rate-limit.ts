export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      if (times.every((t) => t <= now - options.windowMs)) hits.delete(key);
    }
  }

  return {
    hit(key: string, now: number = Date.now()): RateLimitResult {
      if (hits.size > 5_000) prune(now);
      const recent = (hits.get(key) ?? []).filter((t) => t > now - options.windowMs);
      if (recent.length >= options.max) {
        hits.set(key, recent);
        const retryAfterSeconds = Math.max(1, Math.ceil((recent[0] + options.windowMs - now) / 1000));
        return { allowed: false, retryAfterSeconds };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
