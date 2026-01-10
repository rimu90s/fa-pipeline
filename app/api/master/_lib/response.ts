// response.ts
// Standard API response & error helpers
// To keep UX error handling consistent
// Logic will be added step by step

import { NextResponse } from 'next/server'

export type ApiError = { code: string; message: string }

export function ok(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? {} }, { status: 200 })
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}
