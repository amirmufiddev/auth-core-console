import { z } from "zod";

export const adminBillingSearchSchema = z.object({
  page: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10),
  tenantId: z.string().catch(""),
  tierId: z.string().catch("all"),
  status: z
    .enum([
      "all",
      "active",
      "trialing",
      "past_due",
      "paid",
      "manual_invoice",
      "void",
    ])
    .catch("all"),
});

export const adminCreateBillingSchema = z
  .object({
    tenantId: z.string().trim().min(1, "Tenant wajib dipilih"),
    tierId: z.string().trim().min(1, "Tier wajib dipilih"),
    status: z.enum([
      "active",
      "trialing",
      "past_due",
      "paid",
      "manual_invoice",
      "void",
    ]),
    amount: z
      .number({ invalid_type_error: "Nominal harus berupa angka" })
      .int("Nominal harus bilangan bulat")
      .min(0, "Nominal minimal 0"),
    currency: z.string().trim().min(1, "Mata uang wajib diisi"),
    periodStart: z.date({ required_error: "Tanggal mulai periode wajib diisi" }),
    periodEnd: z.date({ required_error: "Tanggal akhir periode wajib diisi" }),
    note: z.string().optional(),
    tenantBillingStatus: z.enum([
      "auto",
      "active",
      "trialing",
      "past_due",
      "suspended",
      "manual_invoice",
    ]),
  })
  .refine((val) => val.periodEnd.getTime() > val.periodStart.getTime(), {
    message: "Akhir periode harus lebih besar dari awal periode",
    path: ["periodEnd"],
  });

export type AdminBillingSearchParams = z.infer<typeof adminBillingSearchSchema>;
export type AdminCreateBillingValues = z.infer<typeof adminCreateBillingSchema>;
