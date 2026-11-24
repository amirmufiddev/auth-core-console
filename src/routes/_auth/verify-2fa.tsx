import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/better-auth";
import { TenantVerify2FAPage } from "@/features/tenant-auth/TenantAuthPages";
import { resolveTenantFromHostname } from "@/lib/tenant-context";

const verifyTwoFactorSearchSchema = z.object({
  redirect: z.string().optional(),
});

function VerifyTwoFactorRoute() {
  const search = Route.useSearch();
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantVerify2FAPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        redirectTo={search.redirect}
        embedded
      />
    );
  }

  return <AuthView view="TWO_FACTOR" />;
}

export const Route = createFileRoute("/_auth/verify-2fa")({
  validateSearch: verifyTwoFactorSearchSchema,
  component: VerifyTwoFactorRoute,
});
