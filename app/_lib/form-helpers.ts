export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function minLen(s: string, n: number): boolean {
  return (s ?? "").trim().length >= n;
}

export type ApiOk<T> = { data: T };
export type ApiErr = { error: { code: string; message: string } };

export async function postJson<TReq extends object, TRes>(
  url: string,
  body: TReq
): Promise<ApiOk<TRes> | ApiErr> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const e = (json as ApiErr | null)?.error;
    return {
      error: {
        code: e?.code ?? "HTTP_ERROR",
        message: e?.message ?? `Request failed (${res.status})`,
      },
    };
  }

  return json as ApiOk<TRes>;
}
