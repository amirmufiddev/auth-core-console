import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/better-auth";
import { TenantVerify2FAPage } from "@/features/tenant-auth/TenantAuthPages";
import {
  resolveTenantFromHostname,
  sanitizeRelativeRedirect,
} from "@/lib/tenant-context";

const verifyTwoFactorSearchSchema = z.object({
  redirect: z.string().optional(),
});

function VerifyTwoFactorRoute() {
  const search = Route.useSearch();
  const safeRedirect = search.redirect
    ? sanitizeRelativeRedirect(search.redirect)
    : undefined;
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantVerify2FAPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        redirectTo={safeRedirect}
        embedded
      />
    );
  }

  return <AuthView view="TWO_FACTOR" redirectTo={safeRedirect} />;
}

export const Route = createFileRoute("/_auth/verify-2fa")({
  validateSearch: verifyTwoFactorSearchSchema,
  component: VerifyTwoFactorRoute,
});
