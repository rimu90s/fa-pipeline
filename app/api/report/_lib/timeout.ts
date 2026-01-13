// app/api/report/_lib/timeout.ts
import { HttpError } from "./errors";

export function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

export function clearTimeoutTimer(timer: ReturnType<typeof setTimeout>) {
  clearTimeout(timer);
}

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    // Timeout must return 503, no audit, no partial file
    throw new HttpError(503, "TIMEOUT", "Service Unavailable");
  }
}
