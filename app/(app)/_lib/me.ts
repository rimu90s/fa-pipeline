// app/(app)/_lib/me.ts
export type UserRole = "FA" | "VIEWER" | "AUDITOR" | "BRANCH_MANAGER" | "COMPANY_ADMIN";

type ReportUserContextResponse = {
  data: {
    userId: string;
    roles: UserRole[];
  };
};

export async function getReportUserContext(): Promise<{ userId: string; roles: UserRole[] }> {
  const res = await fetch("/api/report/_debug/context", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    // Jangan redirect di helper. Biarkan caller yang handle.
    throw new Error(`Failed to load report context: ${res.status}`);
  }

  const json = (await res.json()) as ReportUserContextResponse;
  return { userId: json.data.userId, roles: json.data.roles };
}
