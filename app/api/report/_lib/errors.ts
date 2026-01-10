export class HttpError extends Error {
  public readonly status: number;
  public readonly code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR";

  constructor(
    status: number,
    code: HttpError["code"],
    message: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function assert(condition: boolean, err: HttpError): asserts condition {
  if (!condition) throw err;
}

export function toSafeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
