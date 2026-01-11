import { describe, it, expect, vi } from "vitest";
import { makeReportCtx } from "../_lib/reportCtx";
import { makeAuditMock } from "../_lib/auditMock";
import { makeSupabaseMock } from "../_lib/supabaseMock";

vi.mock("@/app/api/report/_lib/auth", () => ({
  getReportCtx: vi.fn(async () => makeReportCtx({ roles: ["FA"] })),
}));

const allowedViews = new Set([
  "vw_visit_daily_unit",
  "vw_daily_leads_summary",
  "vw_weekly_leads_summary",
]);

vi.mock("@/app/api/report/_lib/supabase", () => {
  const { client, fromCalls } = makeSupabaseMock([
    { date: "2026-01-01", unit_kerja_id: "u1", metric: 1 },
  ]);

  return { getServiceSupabase: () => client, __fromCalls: fromCalls };
});

vi.mock("@/app/api/report/_lib/audit", () => {
  const { writeAuditLog } = makeAuditMock("ok");
  return { writeAuditLog };
});

import { GET as GETVisitDailyXlsx } from "@/app/api/report/export/visit-daily.xlsx/route";
import { GET as GETDailyLeadsXlsx } from "@/app/api/report/export/daily-leads-summary.xlsx/route";
import { GET as GETWeeklyLeadsXlsx } from "@/app/api/report/export/weekly-leads-summary.xlsx/route";

import { GET as GETVisitDailyCsv } from "@/app/api/report/export/visit-daily.csv/route";
import { GET as GETDailyLeadsCsv } from "@/app/api/report/export/daily-leads-summary.csv/route";
import { GET as GETWeeklyLeadsCsv } from "@/app/api/report/export/weekly-leads-summary.csv/route";

async function getFromCalls(): Promise<Array<{ table: string }>> {
  const supa = await import("@/app/api/report/_lib/supabase");
  const calls =
    (supa as unknown as { __fromCalls?: Array<{ table: string }> }).__fromCalls ??
    [];
  return calls;
}

function assertAllViews(calls: Array<{ table: string }>) {
  expect(calls.length).toBeGreaterThan(0);
  for (const c of calls) {
    expect(allowedViews.has(c.table)).toBe(true);
  }
}

describe("PROMPT 9 — view-only enforcement", () => {
  it("XLSX visit-daily queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.xlsx?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETVisitDailyXlsx(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });

  it("XLSX daily-leads-summary queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/daily-leads-summary.xlsx?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETDailyLeadsXlsx(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });

  it("XLSX weekly-leads-summary queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/weekly-leads-summary.xlsx?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETWeeklyLeadsXlsx(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });

  it("CSV visit-daily queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.csv?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETVisitDailyCsv(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });

  it("CSV daily-leads-summary queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/daily-leads-summary.csv?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETDailyLeadsCsv(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });

  it("CSV weekly-leads-summary queries only VIEW", async () => {
    const req = new Request(
      "http://localhost/api/report/export/weekly-leads-summary.csv?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETWeeklyLeadsCsv(req);
    expect(res.status).toBe(200);

    const calls = await getFromCalls();
    assertAllViews(calls);
  });
});
