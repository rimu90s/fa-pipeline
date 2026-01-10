"use client";

import { useEffect, useState } from "react";
import { reportGet } from "../../_lib/reportFetch";
import { lastNDays } from "../../_lib/dateRange";

type Row = {
  date: string;
  unit_name: string;
  metric_total: number;
};

export function VisitDailyTable() {
  const [{ start_date, end_date }] = useState(() => lastNDays(7));
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    reportGet<Row[]>(
      `/api/report/visit-daily?start_date=${start_date}&end_date=${end_date}`
    ).then(setRows);
  }, [start_date, end_date]);

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Unit</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.date}</td>
            <td>{r.unit_name}</td>
            <td>{r.metric_total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
