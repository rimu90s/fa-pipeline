"use client";

import { useState } from "react";
import MasterSelect from "@/app/components/master/MasterSelect";
import { dailyLeadSchema } from "../../_lib/schema";
import { reportPost } from "../../_lib/reportFetch";

type Props = {
  onSuccess: () => void;
};

type LeadStatus = "won" | "lost" | "follow_up";

export function DailyLeadForm({ onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [leadDate, setLeadDate] = useState(today);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [prospect, setProspect] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>("follow_up");
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    const parsed = dailyLeadSchema.safeParse({
      lead_date: leadDate,
      unit_kerja_id: unitId,
      customer_id: customerId ?? undefined,
      prospect_name: prospect || undefined,
      product_id: productId ?? undefined,
      status,
      estimated_value: value,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validasi gagal");
      return;
    }

    try {
      setLoading(true);
      await reportPost("/api/report/daily-leads", parsed.data);
      setCustomerId(null);
      setProspect("");
      setValue(0);
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
      <h2 className="font-semibold">Input Daily Lead</h2>

      {error && <div className="text-red-600">{error}</div>}

      <input
        type="date"
        value={leadDate}
        onChange={(e) => setLeadDate(e.target.value)}
      />

      <MasterSelect
        label="Unit Kerja"
        endpoint="/api/master/work-units"
        value={unitId}
        onChange={(id) => setUnitId(id)}
      />

      <MasterSelect
        label="Customer"
        endpoint="/api/master/customers"
        value={customerId}
        onChange={(id) => {
          setCustomerId(id);
          setProspect("");
        }}
        inlineAdd={{
          enabled: true,
          addLabel: "Tambah Customer",
          createPayload: (name: string) => ({ name }),
        }}
      />

      <input
        placeholder="Prospect (jika bukan customer)"
        value={prospect}
        onChange={(e) => {
          setProspect(e.target.value);
          setCustomerId(null);
        }}
      />

      <MasterSelect
        label="Product"
        endpoint="/api/master/products"
        value={productId}
        onChange={(id) => setProductId(id)}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as LeadStatus)}
      >
        <option value="follow_up">Follow Up</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>

      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
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
