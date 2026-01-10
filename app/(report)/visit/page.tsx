"use client";

import { useEffect, useState } from "react";
import { getReportUserContext } from "../_lib/reportUserContext";
import { hasAnyRole, WRITE_ROLES } from "../_lib/rbac";
import { ReportUserContext } from "../_lib/types";
import { VisitEventForm } from "./_components/VisitEventForm";
import { VisitDailyTable } from "./_components/VisitDailyTable";

export default function VisitPage() {
  const [ctx, setCtx] = useState<ReportUserContext | null>(null);

  useEffect(() => {
    getReportUserContext().then(setCtx);
  }, []);

  if (!ctx) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {hasAnyRole(ctx.roles, WRITE_ROLES) && (
        <VisitEventForm onSuccess={() => {}} />
      )}
      <VisitDailyTable />
    </div>
  );
}
