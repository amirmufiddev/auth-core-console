import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantBillingTab } from "@/features/portal/PortalTenantBillingTab";
import { Route as TenantRoute } from "./route";

function TenantBillingRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return <PortalTenantBillingTab tenantId={tenant.id} tenant={tenant} />;
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/billing",
)({
  component: TenantBillingRouteComponent,
});