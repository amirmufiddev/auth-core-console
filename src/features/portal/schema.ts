import { z } from "zod";
import {
  isValidOAuthRedirectUri,
  isValidTenantSlug,
} from "@/api/tenant-service";

export const portalTenantsSearchSchema = z.object({
  page: z.coerce.number().int().min(0).catch(0),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10),
  search: z.string().catch(""),
  status: z.enum(["all", "active", "suspended"]).catch("all"),
});

export const createPortalTenantSchema = z.object({
  name: z.string().trim().min(1, "Nama tenant wajib diisi"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      isValidTenantSlug,
      "Slug harus 3-63 karakter (huruf kecil, angka, '-') dan bukan reserved slug",
    ),
});

export const updatePortalTenantSchema = z.object({
  name: z.string().trim().min(1, "Nama tenant wajib diisi"),
});

export function parseRedirectUris(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export const createPortalOAuthClientSchema = z.object({
  name: z.string().trim().min(1, "Nama client wajib diisi"),
  type: z.enum(["oidc-confidential", "oidc-public", "mcp-client"]),
  redirectUrisText: z
    .string()
    .trim()
    .min(1, "Minimal 1 Redirect URI wajib diisi")
    .refine((raw) => {
      const list = parseRedirectUris(raw);
      return list.length > 0 && list.every(isValidOAuthRedirectUri);
    }, "Semua Redirect URI harus berupa URL OAuth yang valid (https://, http://, atau custom scheme)"),
  scopesText: z
    .string()
    .trim()
    .min(1, "Minimal 1 scope wajib diisi")
    .refine(
      (raw) => raw.split(/[\s,]+/).filter(Boolean).length > 0,
      "Masukkan minimal 1 scope",
    ),
  pkceRequired: z.boolean(),
});

export type PortalTenantsSearchParams = z.infer<
  typeof portalTenantsSearchSchema
>;
export type CreatePortalTenantValues = z.infer<typeof createPortalTenantSchema>;
export type UpdatePortalTenantValues = z.infer<typeof updatePortalTenantSchema>;
export type CreatePortalOAuthClientValues = z.infer<
  typeof createPortalOAuthClientSchema
>;

export const createPortalApiKeySchema = z.object({
  name: z.string().trim().min(1, "Nama API Key wajib diisi"),
  scopesText: z.string().trim().min(1, "Minimal 1 scope wajib diisi"),
  rateLimitMax: z.coerce.number().int().min(1).max(10_000),
});

export type CreatePortalApiKeyValues = z.infer<typeof createPortalApiKeySchema>;
