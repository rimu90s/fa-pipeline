// app/(app)/_lib/report-user-context.ts
import { cookies, headers } from "next/headers";

export type ReportUserContext = {
  userId: string;
  roles: string[];
};

type DebugContextResponse =
  | { data: ReportUserContext }
  | { error: { code?: string; message?: string } };

export async function getReportUserContext(): Promise<ReportUserContext | null> {
  // NOTE: in some Next versions, headers()/cookies() are async
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const url = `${proto}://${host}/api/report/_debug/context`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  const json = (await res.json().catch(() => null)) as DebugContextResponse | null;
  if (!res.ok) return null;

  if (json && "data" in json && json.data?.userId) return json.data;
  return null;
}
