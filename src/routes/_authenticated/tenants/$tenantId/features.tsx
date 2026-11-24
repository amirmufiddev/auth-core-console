import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantFeaturesTab } from "@/features/portal/PortalTenantFeaturesTab";
import { Route as TenantRoute } from "./route";

function TenantFeaturesRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <PortalTenantFeaturesTab tenantId={tenant.id} tierId={tenant.tierId} />
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/features",
)({
  component: TenantFeaturesRouteComponent,
});