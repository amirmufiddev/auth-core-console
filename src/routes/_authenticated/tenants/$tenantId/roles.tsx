import { createFileRoute } from "@tanstack/react-router";
import { OrganizationRbacPage } from "@/features/organization-rbac/OrganizationRbacPage";
import { Route as TenantRoute } from "./route";

function TenantRolesRouteComponent() {
  const { tenant, mode } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <OrganizationRbacPage tenantId={tenant.id} readOnly={mode !== "owner"} />
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/roles",
)({
  component: TenantRolesRouteComponent,
});
