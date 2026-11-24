import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { listMyTenants } from "@/api/tenant-service";
import { ensureActorPermissions } from "@/api/actor-permissions";
import { resolveAuthenticatedHome } from "@/lib/console-home";
import {
  isPlatformActor,
  toConsoleActor,
} from "@/lib/console-shell";
import {
  PLATFORM_ONBOARDING_PATH,
  shouldRedirectToOwnerOnboarding,
} from "@/lib/owner-onboarding";
import { useAuthStore } from "@/stores/useAuthStore";
import { PlatformShell } from "@/components/layout/PlatformShell";
import type { ActorRoleGrant } from "@/lib/console-shell";

type PlatformRouteContext = {
  roles: ActorRoleGrant[];
  layout: "shell" | "onboarding";
};

export const Route = createFileRoute("/_authenticated/platform")({
  beforeLoad: async ({ context, location }): Promise<PlatformRouteContext> => {
    const user = useAuthStore.getState().user;
    const actor = toConsoleActor(user);

    if (location.pathname === PLATFORM_ONBOARDING_PATH) {
      if (!user) {
        throw redirect({ to: "/login" });
      }
      if (isPlatformActor(actor)) {
        throw redirect({ to: "/platform" });
      }
      const page = await listMyTenants({ page: 0, pageSize: 1 });
      if (!shouldRedirectToOwnerOnboarding(actor, page.total)) {
        throw redirect({ href: await resolveAuthenticatedHome() });
      }
      return { roles: [], layout: "onboarding" };
    }

    if (!user || !isPlatformActor(actor)) {
      throw redirect({ href: await resolveAuthenticatedHome() });
    }
    const roles = await ensureActorPermissions(context.queryClient);
    return { roles, layout: "shell" };
  },
  component: function PlatformRoute() {
    const { roles, layout } = Route.useRouteContext();
    if (layout === "onboarding") {
      return <Outlet />;
    }
    return (
      <PlatformShell roles={roles}>
        <Outlet />
      </PlatformShell>
    );
  },
});