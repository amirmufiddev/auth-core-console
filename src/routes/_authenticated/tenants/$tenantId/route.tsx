import { Outlet, createFileRoute } from "@tanstack/react-router";
import { isPlatformActor } from "@/lib/console-shell";
import { loadTenantShell } from "@/lib/tenant-shell";
import { useAuthStore } from "@/stores/useAuthStore";
import { TenantShell } from "@/components/layout/TenantShell";
import {
  NotFoundState,
  UnauthorizedState,
} from "@/components/layout/ShellState";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  beforeLoad: async ({ params, context }) => {
    const user = useAuthStore.getState().user;
    const actor = {
      role: user?.role ?? null,
      tenantId: null,
    };
    return loadTenantShell(params.tenantId, actor, context.queryClient);
  },
  component: function TenantShellRoute() {
    const { mode, tenant } = Route.useRouteContext();
    const user = useAuthStore.getState().user;
    const actor = {
      role: user?.role ?? null,
      tenantId: null,
    };
    const homeHref = isPlatformActor(actor) ? "/platform" : "/tenants";

    if (mode === "not_found") {
      return <NotFoundState homeHref={homeHref} />;
    }
    if (mode === "denied") {
      return <UnauthorizedState homeHref={homeHref} />;
    }
    if (!tenant) {
      return <NotFoundState homeHref={homeHref} />;
    }

    return (
      <TenantShell mode={mode} tenant={tenant}>
        <Outlet />
      </TenantShell>
    );
  },
});