import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSwitcher } from "@/components/better-auth";
import { PortalTenantOrgsTab } from "@/features/portal/PortalTenantOrgsTab";
import { Route as TenantRoute } from "./route";

function TenantOrganizationsRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OrganizationSwitcher />
      </div>
      <PortalTenantOrgsTab tenantId={tenant.id} tenantSlug={tenant.slug} />
    </div>
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/organizations",
)({
  component: TenantOrganizationsRouteComponent,
});