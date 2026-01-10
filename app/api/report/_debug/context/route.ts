import { NextResponse } from "next/server";
import { getReportCtx } from "@/app/api/report/_lib/auth";

export async function GET() {
  try {
    const ctx = await getReportCtx();

    // getReportCtx() biasanya throw jika tidak login.
    // Kalau ternyata balik tanpa userId, treat as unauthorized.
    if (!ctx?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // HARD RULE: hanya userId + roles
    return NextResponse.json(
      { data: { userId: ctx.userId, roles: ctx.roles } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }
}
