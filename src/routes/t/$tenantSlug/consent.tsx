import { createFileRoute } from "@tanstack/react-router";
import { TenantConsentPage } from "@/features/tenant-auth/TenantAuthPages";

function TenantConsentRoute() {
  const { tenantSlug } = Route.useParams();
  return <TenantConsentPage tenantSlug={tenantSlug} mode="path" />;
}

export const Route = createFileRoute("/t/$tenantSlug/consent")({
  component: TenantConsentRoute,
});
