import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function jsonCreated<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 201, ...init });
}

export function jsonError(code: ApiErrorCode, message: string, status: number) {
  const body: ApiErrorBody = { error: { code, message } };
  return NextResponse.json(body, { status });
}
