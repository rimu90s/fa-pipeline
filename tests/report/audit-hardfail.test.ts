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

// audit throw
vi.mock("@/app/api/report/_lib/audit", () => {
  const { writeAuditLog } = makeAuditMock("throw");
  return { writeAuditLog };
});

import { GET as GETXlsx } from "@/app/api/report/export/visit-daily.xlsx/route";
import { GET as GETCsv } from "@/app/api/report/export/visit-daily.csv/route";

function expectErrorContract(body: unknown) {
  const b = body as { error?: { code?: unknown; message?: unknown } };
  expect(b.error).toBeTruthy();
  expect(typeof b.error?.code).toBe("string");
  expect(typeof b.error?.message).toBe("string");
}

describe("PROMPT 9 — audit hard-fail", () => {
  it("XLSX returns 500 when audit fails (no silent success)", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.xlsx?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETXlsx(req);

    expect(res.status).toBe(500);

    const body = await readJson(res);
    expectErrorContract(body);

    // ensure it is NOT a file response
    const ct = res.headers.get("content-type") ?? "";
    expect(ct.includes("spreadsheetml.sheet")).toBe(false);
  });

  it("CSV returns 500 when audit fails (no silent success)", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.csv?start_date=2026-01-01&end_date=2026-01-31"
    );
    const res = await GETCsv(req);

    expect(res.status).toBe(500);

    const body = await readJson(res);
    expectErrorContract(body);

    const ct = res.headers.get("content-type") ?? "";
    expect(ct.includes("text/csv") || ct.includes("application/csv")).toBe(false);
  });
});
