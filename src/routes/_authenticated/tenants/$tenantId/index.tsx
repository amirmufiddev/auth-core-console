import { createFileRoute } from "@tanstack/react-router";
import { ensureActorPermissions } from "@/api/actor-permissions";
import { TenantHome } from "@/features/portal/TenantHome";
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

    return <TenantHome tenant={tenant} mode={mode} />;
  },
});