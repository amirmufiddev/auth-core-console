import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/better-auth";
import { TenantLoginPage } from "@/features/tenant-auth/TenantAuthPages";
import { resolveTenantFromHostname } from "@/lib/tenant-context";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

function LoginRoute() {
  const search = Route.useSearch();
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantLoginPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        redirectTo={search.redirect}
        embedded
      />
    );
  }

  return <AuthView view="SIGN_IN" redirectTo={search.redirect} />;
}

export const Route = createFileRoute("/_auth/login")({
  validateSearch: loginSearchSchema,
  component: LoginRoute,
});
