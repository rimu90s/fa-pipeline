"use client";

import { useState } from "react";
import MasterSelect from "@/app/components/master/MasterSelect";
import { reportPost } from "../../../_lib/reportFetch";
import { visitEventSchema } from "../../../_lib/schema";

type Props = {
  onSuccess: () => void;
};

export function VisitEventForm({ onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [eventDate, setEventDate] = useState(today);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [metric, setMetric] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    const parsed = visitEventSchema.safeParse({
      event_date: eventDate,
      unit_kerja_id: unitId,
      metric,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validasi gagal");
      return;
    }

    try {
      setLoading(true);
      await reportPost("/api/report/visit-events", parsed.data);
      setMetric(1);
      setNotes("");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-4 space-y-3">
      <h2 className="font-semibold">Input Visit Event</h2>

      {error && <div className="text-red-600">{error}</div>}

      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
      />

      <MasterSelect
        label="Unit Kerja"
        endpoint="/api/master/work-units"
        value={unitId}
        onChange={(id) => setUnitId(id)}
        placeholder="Pilih unit kerja"
      />

      <input
        type="number"
        min={1}
        value={metric}
        onChange={(e) => setMetric(Number(e.target.value))}
      />

      <textarea
        placeholder="Catatan (opsional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button disabled={loading} onClick={submit}>
        {loading ? "Menyimpan..." : "Submit"}
      </button>
    </div>
  );
}
