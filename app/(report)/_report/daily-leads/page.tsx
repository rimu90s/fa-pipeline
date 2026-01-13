"use client";

import { useEffect, useState } from "react";
import { getReportUserContext } from "../../_lib/reportUserContext";
import { hasAnyRole, WRITE_ROLES } from "../../_lib/rbac";
import { ReportUserContext } from "../../_lib/types";
import { DailyLeadForm } from "../../_report/daily-leads/components/DailyLeadForm";
import { DailyLeadsSummaryTable } from "../../_report/daily-leads/components/DailyLeadsSummaryTable";

export default function DailyLeadsPage() {
  const [ctx, setCtx] = useState<ReportUserContext | null>(null);

  useEffect(() => {
    getReportUserContext().then(setCtx);
  }, []);

  if (!ctx) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {hasAnyRole(ctx.roles, WRITE_ROLES) && (
        <DailyLeadForm onSuccess={() => {}} />
      )}
      <DailyLeadsSummaryTable />
    </div>
  );
}
