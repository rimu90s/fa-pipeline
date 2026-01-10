import { ApiErrorPayload, ApiSuccess } from "./types";

function isApiErrorPayload(v: unknown): v is ApiErrorPayload {
  if (typeof v !== "object" || v === null) return false;
  const e = (v as { error?: unknown }).error;
  if (typeof e !== "object" || e === null) return false;
  return (
    typeof (e as { code?: unknown }).code === "string" &&
    typeof (e as { message?: unknown }).message === "string"
  );
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function reportGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const json = await parseJsonSafe(res);

  if (!res.ok) {
    if (isApiErrorPayload(json)) {
      throw new Error(json.error.message);
    }
    throw new Error("Request gagal");
  }

  const payload = json as ApiSuccess<T>;
  return payload.data;
}

export async function reportPost<TReq, TRes>(
  url: string,
  body: TReq
): Promise<TRes> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await parseJsonSafe(res);

  if (!res.ok) {
    if (isApiErrorPayload(json)) {
      throw new Error(json.error.message);
    }
    throw new Error("Request gagal");
  }

  const payload = json as ApiSuccess<TRes>;
  return payload.data;
}
