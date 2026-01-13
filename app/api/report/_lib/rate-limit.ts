// app/api/report/_lib/rate-limit.ts
import { HttpError } from "./errors";

type Bucket = {
  windowStart: number; // epoch ms
  count: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

/**
 * Fixed window rate limit.
 * - Export: 5 req / 60s / user / endpoint
 * - Report read: 30 req / 60s / user / endpoint
 */
export function enforceRateLimit(opts: {
  key: string;         // `${ctx.userId}:${endpoint}`
  limit: number;       // 5 or 30
  windowMs: number;    // 60_000
}) {
  const t = now();
  const b = buckets.get(opts.key);

  if (!b) {
    buckets.set(opts.key, { windowStart: t, count: 1 });
    return;
  }

  // window expired → reset
  if (t - b.windowStart >= opts.windowMs) {
    buckets.set(opts.key, { windowStart: t, count: 1 });
    return;
  }

  // within window
  if (b.count >= opts.limit) {
    throw new HttpError(429, "RATE_LIMIT", "Too many requests");
  }

  b.count += 1;
  buckets.set(opts.key, b);
}

/**
 * (Optional) hygiene: prune old buckets so Map doesn't grow forever.
 * Called opportunistically from routes.
 */
export function pruneRateLimitBuckets(maxAgeMs = 5 * 60_000) {
  const t = now();
  for (const [k, b] of buckets.entries()) {
    if (t - b.windowStart > maxAgeMs) buckets.delete(k);
  }
}
