import { describe, it, expect, vi } from "vitest";
import { makeReportCtx } from "../_lib/reportCtx";
import { makeSupabaseMock } from "../_lib/supabaseMock";
import { makeAuditMock } from "../_lib/auditMock";
import { readJson } from "../_lib/nextResponse";

vi.mock("@/app/api/report/_lib/auth", () => ({
  getReportCtx: vi.fn(async () => makeReportCtx({ roles: ["FA"] })),
}));

vi.mock("@/app/api/report/_lib/supabase", () => {
  const { client } = makeSupabaseMock([
    { date: "2026-01-01", unit_kerja_id: "u1", metric: 1 },
  ]);
  return { getServiceSupabase: () => client };
});

vi.mock("@/app/api/report/_lib/audit", () => {
  const { writeAuditLog } = makeAuditMock("ok");
  return { writeAuditLog };
});

const endpoints = [
  {
    name: "visit-daily.csv",
    importer: () => import("@/app/api/report/export/visit-daily.csv/route"),
  },
  {
    name: "daily-leads-summary.csv",
    importer: () =>
      import("@/app/api/report/export/daily-leads-summary.csv/route"),
  },
  {
    name: "weekly-leads-summary.csv",
    importer: () =>
      import("@/app/api/report/export/weekly-leads-summary.csv/route"),
  },
] as const;

function expectErrorContract(body: unknown) {
  const b = body as { error?: { code?: unknown; message?: unknown } };
  expect(b.error).toBeTruthy();
  expect(typeof b.error?.code).toBe("string");
  expect(typeof b.error?.message).toBe("string");
}

describe("PROMPT 9 — validation export-csv", () => {
  for (const ep of endpoints) {
    it(`[${ep.name}] returns 422 if start_date missing`, async () => {
      const mod = await ep.importer();
      const req = new Request(
        `http://localhost/api/report/export/${ep.name}?end_date=2026-01-31`
      );
      const res = await mod.GET(req);
      expect(res.status).toBe(422);

      const body = await readJson(res);
      expectErrorContract(body);

      const raw = JSON.stringify(body);
      expect(raw.includes("start_date")).toBe(true);
    });

    it(`[${ep.name}] returns 422 if end_date missing`, async () => {
      const mod = await ep.importer();
      const req = new Request(
        `http://localhost/api/report/export/${ep.name}?start_date=2026-01-01`
      );
      const res = await mod.GET(req);
      expect(res.status).toBe(422);

      const body = await readJson(res);
      expectErrorContract(body);

      const raw = JSON.stringify(body);
      expect(raw.includes("end_date")).toBe(true);
    });
  }
});
