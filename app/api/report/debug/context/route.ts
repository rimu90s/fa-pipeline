// app/api/report/debug/context/route.ts
import { NextResponse } from "next/server";
import { getReportCtx } from "@/app/api/report/_lib/auth";

export async function GET() {
  try {
    const ctx = await getReportCtx();
    const userId = typeof ctx?.userId === "string" ? ctx.userId : "";
    const roles = Array.isArray(ctx?.roles) ? ctx.roles : [];
    return NextResponse.json({ userId, roles }, { status: 200 });
  } catch {
    return NextResponse.json({ userId: "", roles: [] }, { status: 200 });
  }
}
