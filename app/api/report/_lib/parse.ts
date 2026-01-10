import { HttpError } from "./errors";

export type VisitEventCreatePayload = {
  event_date: string; // ISO date (YYYY-MM-DD)
  unit_kerja_id: string; // uuid
  metric: number; // >= 1
  notes?: string;
};

export type DailyLeadCreatePayload = {
  lead_date: string; // ISO date (YYYY-MM-DD)
  unit_kerja_id: string; // uuid
  customer_id?: string;
  prospect_name?: string;
  product_id?: string;
  status: "won" | "lost" | "follow_up";
  estimated_value?: number; // >= 0
  notes?: string;
};

function isIsoDateOnly(s: string): boolean {
  // YYYY-MM-DD (simple strict)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(d.getTime());
}

export async function parseJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "BAD_REQUEST", "Payload tidak valid");
  }
}

export function parseVisitEventCreatePayload(body: unknown): VisitEventCreatePayload {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "BAD_REQUEST", "Payload tidak valid");
  }
  const r = body as Record<string, unknown>;

  const event_date = r["event_date"];
  const unit_kerja_id = r["unit_kerja_id"];
  const metric = r["metric"];
  const notes = r["notes"];

  if (typeof event_date !== "string" || !isIsoDateOnly(event_date)) {
    throw new HttpError(400, "BAD_REQUEST", "Tanggal wajib diisi");
  }
  if (typeof unit_kerja_id !== "string" || unit_kerja_id.length === 0) {
    throw new HttpError(400, "BAD_REQUEST", "Unit kerja tidak valid");
  }
  if (typeof metric !== "number" || !Number.isFinite(metric) || metric < 1) {
    throw new HttpError(400, "BAD_REQUEST", "Metric minimal 1");
  }
  if (notes !== undefined && typeof notes !== "string") {
    throw new HttpError(400, "BAD_REQUEST", "Catatan tidak valid");
  }

  return { event_date, unit_kerja_id, metric, notes };
}

export function parseDailyLeadCreatePayload(body: unknown): DailyLeadCreatePayload {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "BAD_REQUEST", "Payload tidak valid");
  }
  const r = body as Record<string, unknown>;

  const lead_date = r["lead_date"];
  const unit_kerja_id = r["unit_kerja_id"];
  const customer_id = r["customer_id"];
  const prospect_name = r["prospect_name"];
  const product_id = r["product_id"];
  const status = r["status"];
  const estimated_value = r["estimated_value"];
  const notes = r["notes"];

  if (typeof lead_date !== "string" || !isIsoDateOnly(lead_date)) {
    throw new HttpError(400, "BAD_REQUEST", "Tanggal wajib diisi");
  }
  if (typeof unit_kerja_id !== "string" || unit_kerja_id.length === 0) {
    throw new HttpError(400, "BAD_REQUEST", "Unit kerja tidak valid");
  }

  if (status !== "won" && status !== "lost" && status !== "follow_up") {
    throw new HttpError(400, "BAD_REQUEST", "Status tidak valid");
  }

  const hasCustomer = typeof customer_id === "string" && customer_id.trim().length > 0;
  const hasProspect = typeof prospect_name === "string" && prospect_name.trim().length > 0;

  if (!hasCustomer && !hasProspect) {
    throw new HttpError(400, "BAD_REQUEST", "Minimal isi customer atau prospect name");
  }

  if (estimated_value !== undefined && estimated_value !== null) {
    if (typeof estimated_value !== "number" || !Number.isFinite(estimated_value) || estimated_value < 0) {
      throw new HttpError(400, "BAD_REQUEST", "Estimated value harus >= 0");
    }
  }

  if (notes !== undefined && typeof notes !== "string") {
    throw new HttpError(400, "BAD_REQUEST", "Catatan tidak valid");
  }

  return {
    lead_date,
    unit_kerja_id,
    customer_id: hasCustomer ? (customer_id as string).trim() : undefined,
    prospect_name: hasProspect ? (prospect_name as string).trim() : undefined,
    product_id: typeof product_id === "string" && product_id.trim().length > 0 ? product_id.trim() : undefined,
    status,
    estimated_value: typeof estimated_value === "number" ? estimated_value : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  };
}

export function parseQueryIsoDate(value: string | null, fieldLabel: string): string {
  if (!value) throw new HttpError(400, "BAD_REQUEST", `${fieldLabel} wajib diisi`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "BAD_REQUEST", `${fieldLabel} tidak valid`);
  }
  const d = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) throw new HttpError(400, "BAD_REQUEST", `${fieldLabel} tidak valid`);
  return value;
}

export function parseQueryMonth(value: string | null, fieldLabel: string): string {
  // month as YYYY-MM-01 (month start) recommended
  return parseQueryIsoDate(value, fieldLabel);
}

export function parseOptionalString(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
