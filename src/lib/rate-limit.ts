import { NextRequest } from "next/server";
import { RateLimitError } from "./errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(store.entries())) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyPrefix = "rl" } = options;

  return function checkRateLimit(identifier: string): void {
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (entry.count >= max) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds.`
      );
    }

    entry.count++;
    store.set(key, entry);
  };
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}

// Pre-configured rate limiters
export const redirectRateLimit = rateLimit({
  max: 60,
  windowMs: 60_000,
  keyPrefix: "redirect",
});

export const apiRateLimit = rateLimit({
  max: 100,
  windowMs: 60_000,
  keyPrefix: "api",
});

export const authRateLimit = rateLimit({
  max: 10,
  windowMs: 60_000,
  keyPrefix: "auth",
});
