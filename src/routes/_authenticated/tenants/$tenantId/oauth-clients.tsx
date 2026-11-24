import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantOAuthClientsTab } from "@/features/portal/PortalTenantOAuthClientsTab";
import { Route as TenantRoute } from "./route";

function TenantOAuthClientsRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <PortalTenantOAuthClientsTab tenantId={tenant.id} tenant={tenant} />
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/oauth-clients",
)({
  component: TenantOAuthClientsRouteComponent,
});