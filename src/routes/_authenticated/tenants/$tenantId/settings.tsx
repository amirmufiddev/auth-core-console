import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantSettingsTab } from "@/features/portal/PortalTenantSettingsTab";
import { Route as TenantRoute } from "./route";

function TenantSettingsRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return <PortalTenantSettingsTab tenantId={tenant.id} tenant={tenant} />;
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/settings",
)({
  component: TenantSettingsRouteComponent,
});