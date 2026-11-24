import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantApiKeysTab } from "@/features/portal/PortalTenantApiKeysTab";
import { Route as TenantRoute } from "./route";

function TenantApiKeysRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <PortalTenantApiKeysTab tenantId={tenant.id} tierId={tenant.tierId} />
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/api-keys",
)({
  component: TenantApiKeysRouteComponent,
});