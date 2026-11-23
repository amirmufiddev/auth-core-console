import { z } from "zod";
import { isValidTenantSlug } from "@/api/tenant-service";

export const adminTenantsSearchSchema = z.object({
  page: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10),
  search: z.string().catch(""),
  status: z.enum(["all", "active", "suspended"]).catch("all"),
  tierId: z.string().catch("all"),
});

export const adminCreateTenantSchema = z.object({
  name: z.string().trim().min(1, "Nama tenant wajib diisi"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      isValidTenantSlug,
      "Slug harus 3-63 karakter (huruf kecil, angka, tanda '-') dan bukan reserved slug",
    ),
  ownerUserId: z.string().trim().min(1, "Owner User ID wajib diisi"),
  tierId: z.string().min(1, "Tier wajib dipilih"),
  billingStatus: z.enum([
    "active",
    "trialing",
    "past_due",
    "suspended",
    "manual_invoice",
  ]),
});

export const adminChangeTierSchema = z.object({
  tierId: z.string().min(1, "Tier wajib dipilih"),
});

export type AdminTenantsSearchParams = z.infer<typeof adminTenantsSearchSchema>;
export type AdminCreateTenantValues = z.infer<typeof adminCreateTenantSchema>;
export type AdminChangeTierValues = z.infer<typeof adminChangeTierSchema>;
