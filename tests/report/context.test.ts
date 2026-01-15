import { describe, it, expect, vi } from "vitest";
import { readJson } from "../_lib/nextResponse";
import { makeReportCtx } from "../_lib/reportCtx";

vi.mock("@/app/api/report/_lib/auth", () => {
  return {
    getReportCtx: vi.fn(async () => makeReportCtx({ roles: ["FA"] })),
  };
});

import { GET } from "@/app/api/report/debug/context/route";

describe("PROMPT 9 — context endpoint", () => {
  it("returns only userId and roles (no tenant scope leak)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await readJson(res);
    expect(typeof body).toBe("object");

    const b = body as { data?: { userId?: string; roles?: string[] } };
    expect(b.data?.userId).toBeTruthy();
    expect(Array.isArray(b.data?.roles)).toBe(true);

    const raw = JSON.stringify(body);
    expect(raw.includes("companyId")).toBe(false);
    expect(raw.includes("branchId")).toBe(false);
    expect(raw.includes("allowedBranchIds")).toBe(false);
    expect(raw.includes("scope")).toBe(false);
  });

  it("returns 401 if getReportCtx throws", async () => {
    const mod = await import("@/app/api/report/_lib/auth");

    const mocked = mod.getReportCtx as unknown as {
      mockImplementationOnce: (fn: () => Promise<unknown>) => void;
    };

    mocked.mockImplementationOnce(async () => {
      throw new Error("not logged in");
    });

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await readJson(res);
    const raw = JSON.stringify(body);
    expect(raw.includes("UNAUTHORIZED")).toBe(true);
  });
});
