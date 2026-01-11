import { describe, it, expect, vi } from "vitest";
import { makeReportCtx } from "../_lib/reportCtx";
import { makeSupabaseMock } from "../_lib/supabaseMock";
import { makeAuditMock } from "../_lib/auditMock";

vi.mock("@/app/api/report/_lib/auth", () => ({
  getReportCtx: vi.fn(async () =>
    makeReportCtx({
      roles: ["FA"],
      allowedBranchIds: ["b1", "b2"],
    })
  ),
}));

vi.mock("@/app/api/report/_lib/supabase", () => {
  const { client, inCalls } = makeSupabaseMock([
    { date: "2026-01-01", unit_kerja_id: "u1", metric: 1 },
  ]);
  return { getServiceSupabase: () => client, __inCalls: inCalls };
});

vi.mock("@/app/api/report/_lib/audit", () => {
  const { writeAuditLog } = makeAuditMock("ok");
  return { writeAuditLog };
});

import { GET as GETXlsx } from "@/app/api/report/export/visit-daily.xlsx/route";
import { GET as GETCsv } from "@/app/api/report/export/visit-daily.csv/route";

async function getInCalls(): Promise<Array<{ column: string; values: unknown[] }>> {
  const supa = await import("@/app/api/report/_lib/supabase");
  const calls =
    (supa as unknown as {
      __inCalls?: Array<{ column: string; values: unknown[] }>;
    }).__inCalls ?? [];
  return calls;
}

function assertBranchIn(calls: Array<{ column: string; values: unknown[] }>) {
  const branchCalls = calls.filter((c) => c.column === "branch_id");
  expect(branchCalls.length).toBeGreaterThan(0);

  const flattened = branchCalls.flatMap((c) => c.values);
  expect(flattened.includes("b1")).toBe(true);
  expect(flattened.includes("b2")).toBe(true);

  // confirm not using client param "HACKED"
  expect(flattened.includes("HACKED")).toBe(false);
}

describe("PROMPT 9 — tenant safety", () => {
  it("XLSX must apply branch_id IN allowedBranchIds regardless of query params", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.xlsx?start_date=2026-01-01&end_date=2026-01-31&branch_id=HACKED"
    );
    const res = await GETXlsx(req);
    expect(res.status).toBe(200);

    const calls = await getInCalls();
    assertBranchIn(calls);
  });

  it("CSV must apply branch_id IN allowedBranchIds regardless of query params", async () => {
    const req = new Request(
      "http://localhost/api/report/export/visit-daily.csv?start_date=2026-01-01&end_date=2026-01-31&branch_id=HACKED"
    );
    const res = await GETCsv(req);
    expect(res.status).toBe(200);

    const calls = await getInCalls();
    assertBranchIn(calls);
  });
});
