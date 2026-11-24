import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/better-auth";
import { TenantRegisterPage } from "@/features/tenant-auth/TenantAuthPages";
import {
  resolveTenantFromHostname,
  sanitizeRelativeRedirect,
} from "@/lib/tenant-context";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
});

function RegisterRoute() {
  const search = Route.useSearch();
  const safeRedirect = search.redirect
    ? sanitizeRelativeRedirect(search.redirect)
    : undefined;
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantRegisterPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        redirectTo={safeRedirect}
        embedded
      />
    );
  }

  return <AuthView view="SIGN_UP" redirectTo={safeRedirect} />;
}

export const Route = createFileRoute("/_auth/register")({
  validateSearch: registerSearchSchema,
  component: RegisterRoute,
});
