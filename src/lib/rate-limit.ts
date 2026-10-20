import { HttpError } from "./security";

type Entry = { count: number; resetAt: number };

const globalStore = globalThis as unknown as {
  __hlbhRateLimit?: Map<string, Entry>;
};

const store = globalStore.__hlbhRateLimit ?? new Map<string, Entry>();
globalStore.__hlbhRateLimit = store;

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}

export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = "操作过于频繁，请稍后再试",
) {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.ok) {
    throw new HttpError(
      429,
      `${message}（约 ${Math.max(1, Math.ceil(result.retryAfter / 60))} 分钟后可重试）`,
    );
  }
}
