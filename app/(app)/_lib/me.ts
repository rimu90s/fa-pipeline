// app/(app)/_lib/me.ts
export type UserRole =
  | "FA"
  | "VIEWER"
  | "AUDITOR"
  | "BRANCH_MANAGER"
  | "COMPANY_ADMIN";

export type ReportUserContextData = {
  userId: string;
  roles: UserRole[];
};

function isOkShape(v: unknown): v is { userId: string; roles: unknown[] } {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return typeof obj.userId === "string" && Array.isArray(obj.roles);
}

/**
 * Client-side context fetch for Dashboard / AppShell.
 * IMPORTANT: must match server endpoint output: { userId, roles }.
 */
export async function getReportUserContext(): Promise<ReportUserContextData> {
  // Use non-underscore route that we know resolves in this project
  const res = await fetch("/api/report/debug/context", {
    method: "GET",
    cache: "no-store",
    // cookies will be sent for same-origin fetch by default
  });

  const text = await res.text();
  let json: unknown = null;

  try {
    json = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    // ignore non-JSON
  }

  // For safety: never crash UI with opaque error
  if (!res.ok) {
    // Treat as unauthenticated (or temporarily unavailable)
    return { userId: "", roles: [] };
  }

  if (!isOkShape(json)) {
    // Treat as unauthenticated rather than throwing (prevents login loop)
    return { userId: "", roles: [] };
  }

  return { userId: json.userId, roles: json.roles as UserRole[] };
}
