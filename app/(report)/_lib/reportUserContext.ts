import { ReportUserContext } from "./types";

export async function getReportUserContext(): Promise<ReportUserContext> {
  const res = await fetch("/api/report/_debug/context", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      "Missing report context endpoint. Provide GET /api/report/_debug/context returning roles[]"
    );
  }

  const json = (await res.json()) as unknown;

  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { userId?: unknown }).userId !== "string" ||
    !Array.isArray((json as { roles?: unknown }).roles)
  ) {
    throw new Error("Invalid report user context response");
  }

  return json as ReportUserContext;
}
