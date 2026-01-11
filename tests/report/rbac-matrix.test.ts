import { describe, it, expect, vi } from "vitest";
import { makeReportCtx, type UserRole } from "../_lib/reportCtx";
import { makeSupabaseMock } from "../_lib/supabaseMock";
import { makeAuditMock } from "../_lib/auditMock";

const allowed: UserRole[] = ["FA", "BRANCH_MANAGER", "COMPANY_ADMIN", "AUDITOR"];
const forbidden: UserRole[] = ["VIEWER"];

function mockForRole(role: UserRole) {
  vi.resetModules();

  vi.doMock("@/app/api/report/_lib/auth", () => ({
    getReportCtx: vi.fn(async () => makeReportCtx({ roles: [role] })),
  }));

  vi.doMock("@/app/api/report/_lib/supabase", () => {
    const { client } = makeSupabaseMock([
      { date: "2026-01-01", unit_kerja_id: "u1", metric: 1 },
    ]);
    return { getServiceSupabase: () => client };
  });

  vi.doMock("@/app/api/report/_lib/audit", () => {
    const { writeAuditLog } = makeAuditMock("ok");
    return { writeAuditLog };
  });
}

async function run(
  url: string,
  importer: () => Promise<{ GET: (req: Request) => Promise<Response> }>
) {
  const mod = await importer();
  const req = new Request(url);
  return mod.GET(req);
}

describe("PROMPT 9 — RBAC matrix export", () => {
  for (const role of allowed) {
    it(`allows XLSX export for role=${role}`, async () => {
      mockForRole(role);

      const res = await run(
        "http://localhost/api/report/export/visit-daily.xlsx?start_date=2026-01-01&end_date=2026-01-31",
        () => import("@/app/api/report/export/visit-daily.xlsx/route")
      );

      expect(res.status).toBe(200);
      const ct = res.headers.get("content-type") ?? "";
      expect(ct.includes("spreadsheetml.sheet")).toBe(true);
    });

    it(`allows CSV export for role=${role}`, async () => {
      mockForRole(role);

      const res = await run(
        "http://localhost/api/report/export/visit-daily.csv?start_date=2026-01-01&end_date=2026-01-31",
        () => import("@/app/api/report/export/visit-daily.csv/route")
      );

      expect(res.status).toBe(200);
      const ct = res.headers.get("content-type") ?? "";
      expect(ct.includes("text/csv") || ct.includes("application/csv")).toBe(true);
    });
  }

  for (const role of forbidden) {
    it(`forbids XLSX export for role=${role}`, async () => {
      mockForRole(role);

      const res = await run(
        "http://localhost/api/report/export/visit-daily.xlsx?start_date=2026-01-01&end_date=2026-01-31",
        () => import("@/app/api/report/export/visit-daily.xlsx/route")
      );

      expect(res.status).toBe(403);
    });

    it(`forbids CSV export for role=${role}`, async () => {
      mockForRole(role);

      const res = await run(
        "http://localhost/api/report/export/visit-daily.csv?start_date=2026-01-01&end_date=2026-01-31",
        () => import("@/app/api/report/export/visit-daily.csv/route")
      );

      expect(res.status).toBe(403);
    });
  }
});
