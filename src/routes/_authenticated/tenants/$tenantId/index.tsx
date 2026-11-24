import { createFileRoute } from "@tanstack/react-router";
import { ensureActorPermissions } from "@/api/actor-permissions";
import { Can } from "@/components/layout/Can";
import {
  TenantBillingStatusBadge,
  TenantStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { PortalTenantSupportActions } from "@/features/portal/PortalTenantSupportActions";
import { Route as TenantRoute } from "./route";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId/")({
  beforeLoad: async ({ context }) => {
    if (context.mode === "support") {
      const roles = await ensureActorPermissions(context.queryClient);
      return { supportRoles: roles };
    }
    return {};
  },
  component: function TenantOverviewRoute() {
    const { mode, tenant } = TenantRoute.useRouteContext();
    if (!tenant) return null;

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-default-900">
            Ringkasan Tenant
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            slug: {tenant.slug} · id: {tenant.id} · config v
            {tenant.configVersion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <TenantStatusBadge status={tenant.status} />
          <TenantTierBadge tierId={tenant.tierId} />
          <TenantBillingStatusBadge status={tenant.billingStatus} />
        </div>

        {mode === "support" && (
          <Can resource="organization" action="update">
            <PortalTenantSupportActions tenant={tenant} />
          </Can>
        )}
      </div>
    );
  },
});