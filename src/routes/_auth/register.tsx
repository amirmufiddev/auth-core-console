import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthView } from "@/components/better-auth";
import { TenantRegisterPage } from "@/features/tenant-auth/TenantAuthPages";
import { resolveTenantFromHostname } from "@/lib/tenant-context";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
});

function RegisterRoute() {
  const search = Route.useSearch();
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantRegisterPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        redirectTo={search.redirect}
        embedded
      />
    );
  }

  return <AuthView view="SIGN_UP" />;
}

export const Route = createFileRoute("/_auth/register")({
  validateSearch: registerSearchSchema,
  component: RegisterRoute,
});
