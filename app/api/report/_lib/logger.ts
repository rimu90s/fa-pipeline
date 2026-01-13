// app/api/report/_lib/logger.ts
type Level = "info" | "warn" | "error";

export type LogShape = {
  level: Level;
  request_id: string;
  user_id: string;
  endpoint: string;
  message: string;
  duration_ms?: number;
};

export function logJson(entry: LogShape) {
  // Server-only: Next.js route handler runs on server
  // Do NOT log payload, token, SQL, PII.
  console.log(JSON.stringify(entry));
}
