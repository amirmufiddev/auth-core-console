import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { fetchActorPermissions } from "@/api/actor-permissions";
import { resolveAuthenticatedHome } from "@/lib/console-home";
import { isPlatformActor, toConsoleActor } from "@/lib/console-shell";
import { useAuthStore } from "@/stores/useAuthStore";
import { PlatformShell } from "@/components/layout/PlatformShell";

export const Route = createFileRoute("/_authenticated/platform")({
  beforeLoad: async () => {
    const user = useAuthStore.getState().user;
    const actor = toConsoleActor(user);
    if (!user || !isPlatformActor(actor)) {
      throw redirect({ href: await resolveAuthenticatedHome() });
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