// app/(app)/exports/page.tsx
import { ExportPage } from "./_components/ExportPage";
import { getReportUserContext } from "@/app/(app)/_lib/report-user-context";

const EXPORT_ALLOWED_ROLES = new Set([
  "FA",
  "BRANCH_MANAGER",
  "COMPANY_ADMIN",
  "AUDITOR",
]);

export default async function ExportsPage() {
  const ctx = await getReportUserContext();

  // Safe fallback: if ctx missing, treat as no access
  const roles = ctx?.roles ?? [];
  const canExport = roles.some((r) => EXPORT_ALLOWED_ROLES.has(r));

  return <ExportPage canExport={canExport} roles={roles} />;
}
