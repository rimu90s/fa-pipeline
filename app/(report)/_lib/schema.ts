import { z } from "zod";

export const visitEventSchema = z.object({
  event_date: z.string().min(10),
  unit_kerja_id: z.string().uuid(),
  metric: z.number().min(1),
  notes: z.string().optional(),
});

export const dailyLeadSchema = z
  .object({
    lead_date: z.string().min(10),
    unit_kerja_id: z.string().uuid(),
    customer_id: z.string().uuid().optional(),
    prospect_name: z.string().optional(),
    product_id: z.string().uuid().optional(),
    status: z.enum(["won", "lost", "follow_up"]),
    estimated_value: z.number().min(0),
    notes: z.string().optional(),
  })
  .refine(
    (v) =>
      (v.customer_id && !v.prospect_name) ||
      (!v.customer_id && v.prospect_name),
    {
      message: "Harus isi customer ATAU prospect (bukan keduanya)",
      path: ["customer_id"],
    }
  );
