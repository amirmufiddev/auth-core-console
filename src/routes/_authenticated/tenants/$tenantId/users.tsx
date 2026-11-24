import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantUsersTab } from "@/features/portal/PortalTenantUsersTab";
import { Route as TenantRoute } from "./route";

function TenantUsersRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <PortalTenantUsersTab tenantId={tenant.id} tenantSlug={tenant.slug} />
  );
}

export const Route = createFileRoute("/_authenticated/tenants/$tenantId/users")(
  {
    component: TenantUsersRouteComponent,
  },
);