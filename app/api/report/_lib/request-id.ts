// app/api/report/_lib/request-id.ts
import crypto from "crypto";

export function getRequestId(req: Request): string {
  const h = req.headers.get("x-request-id");
  if (h && h.trim().length > 0) return h.trim();
  return crypto.randomUUID();
}
