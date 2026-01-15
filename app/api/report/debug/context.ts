// pages/api/report/_debug/context.ts
import type { NextApiRequest, NextApiResponse } from "next";

// This endpoint is required by app/(report)/_lib/reportUserContext.ts
// It must return 200 OK with root-level { userId: string, roles: string[] }.
// IMPORTANT: Do not return 401/403/404 here, otherwise the report module will throw.

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Never cache
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Minimal safe payload to prevent UI crash.
  // You can later enhance this to read auth cookies and return real roles.
  return res.status(200).json({ userId: "", roles: [] });
}
