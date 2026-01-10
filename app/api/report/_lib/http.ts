import { NextResponse } from "next/server";

type ErrPayload = { error: { code: string; message: string } };
type OkPayload<T> = { data: T };

export function jsonOk<T>(data: T, init?: ResponseInit) {
  const body: OkPayload<T> = { data };
  return NextResponse.json(body, { status: 200, ...(init ?? {}) });
}

export function jsonErr(status: number, code: string, message: string, init?: ResponseInit) {
  const body: ErrPayload = { error: { code, message } };
  return NextResponse.json(body, { status, ...(init ?? {}) });
}
