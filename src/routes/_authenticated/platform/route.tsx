import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { fetchActorPermissions } from "@/api/actor-permissions";
import { isPlatformActor } from "@/lib/console-shell";
import { useAuthStore } from "@/stores/useAuthStore";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const Route = createFileRoute("/_authenticated/platform")({
  beforeLoad: async () => {
    const user = useAuthStore.getState().user;
    const actor = {
      role: user?.role ?? null,
      tenantId: null,
    };
    if (!user || !isPlatformActor(actor)) {
      throw redirect({ to: "/tenants" });
    }
    const { roles } = await fetchActorPermissions();
    return { roles };
  },
  component: function PlatformRoute() {
    const { roles } = Route.useRouteContext();
    return (
      <PlatformShell roles={roles}>
        <Outlet />
      </PlatformShell>
    );
  },
});