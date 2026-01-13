"use client";

import { useEffect, useState } from "react";
import { reportGet } from "../../../_lib/reportFetch";
import { lastNDays } from "../../../_lib/dateRange";

type Row = {
  date: string;
  unit_name: string;
  total_leads: number;
  total_value: number;
};

export function DailyLeadsSummaryTable() {
  const [{ start_date, end_date }] = useState(() => lastNDays(7));
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    reportGet<Row[]>(
      `/api/report/daily-leads-summary?start_date=${start_date}&end_date=${end_date}`
    ).then(setRows);
  }, [start_date, end_date]);

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Unit</th>
          <th>Leads</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.date}</td>
            <td>{r.unit_name}</td>
            <td>{r.total_leads}</td>
            <td>{r.total_value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
