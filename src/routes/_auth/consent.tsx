import { createFileRoute } from "@tanstack/react-router";
import { ConsentPage } from "@/features/auth/ConsentPage";
import { TenantConsentPage } from "@/features/tenant-auth/TenantAuthPages";
import { resolveTenantFromHostname } from "@/lib/tenant-context";

function ConsentRoute() {
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantConsentPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        embedded
      />
    );
  }

  return <ConsentPage />;
}

export const Route = createFileRoute("/_auth/consent")({
  component: ConsentRoute,
});
