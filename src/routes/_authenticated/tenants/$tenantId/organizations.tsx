import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSwitcher } from "@/components/better-auth";
import { OwnerOnly } from "@/components/layout/Can";
import { PortalTenantOrgsTab } from "@/features/portal/PortalTenantOrgsTab";
import { Route as TenantRoute } from "./route";

function TenantOrganizationsRouteComponent() {
  const { tenant } = TenantRoute.useRouteContext();
  if (!tenant) return null;
  return (
    <div className="space-y-4">
      <OwnerOnly>
        <div className="flex justify-end">
          <OrganizationSwitcher />
        </div>
      </OwnerOnly>
      <PortalTenantOrgsTab tenantId={tenant.id} tenantSlug={tenant.slug} />
    </div>
  );
}

export const Route = createFileRoute(
  "/_authenticated/tenants/$tenantId/organizations",
)({
  component: TenantOrganizationsRouteComponent,
});