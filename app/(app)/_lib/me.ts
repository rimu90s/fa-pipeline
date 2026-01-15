// app/(app)/_lib/me.ts
export type UserRole = "FA" | "VIEWER" | "AUDITOR" | "BRANCH_MANAGER" | "COMPANY_ADMIN";

type ReportUserContextData = {
  userId: string;
  roles: UserRole[];
};

type ReportUserContextOk = {
  data: ReportUserContextData;
};

type ReportUserContextErr = {
  error?: { code?: string; message?: string };
};

function isOkShape(v: unknown): v is ReportUserContextOk {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if (!("data" in obj)) return false;

  const data = obj["data"];
  if (!data || typeof data !== "object") return false;

  const d = data as Record<string, unknown>;
  return typeof d["userId"] === "string" && Array.isArray(d["roles"]);
}

export async function getReportUserContext(): Promise<ReportUserContextData> {
  const res = await fetch("/api/report/_debug/context", {
    method: "GET",
    cache: "no-store",
  });

  // IMPORTANT:
  // - Jangan throw untuk 401/403 (user belum login / tidak punya akses) agar UI tidak crash.
  // - Caller (Sidebar/RoleGate) bisa fallback dengan roles [].
  if (res.status === 401 || res.status === 403) {
    return { userId: "", roles: [] };
  }

  const text = await res.text();
  let json: unknown = null;

  try {
    json = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    // Jika backend kirim message, tampilkan untuk debugging, tapi tetap error yang jelas.
    const msg =
      json && typeof json === "object"
        ? ((json as ReportUserContextErr).error?.message ?? `HTTP ${res.status}`)
        : `HTTP ${res.status}`;
    throw new Error(`Failed to load report context: ${msg}`);
  }

  if (!isOkShape(json)) {
    throw new Error("Missing report context endpoint. Provide GET /api/report/_debug/context returning roles[]");
  }

  return { userId: json.data.userId, roles: json.data.roles };
}
