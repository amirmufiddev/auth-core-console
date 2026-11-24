import { createFileRoute, redirect } from "@tanstack/react-router";
import { listMyTenants } from "@/api/tenant-service";
import { isPlatformActor, toConsoleActor } from "@/lib/console-shell";
import {
  PLATFORM_ONBOARDING_PATH,
  shouldRedirectToOwnerOnboarding,
} from "@/lib/owner-onboarding";
import { PortalTenantsPage } from "@/features/portal/PortalTenantsPage";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  type PortalTenantsSearchParams,
  portalTenantsSearchSchema,
} from "@/features/portal/schema";

function PortalTenantsRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleUpdateSearch = (patch: Partial<PortalTenantsSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <PortalTenantsPage
      searchParams={search}
      onUpdateSearch={handleUpdateSearch}
    />
  );
}

export const Route = createFileRoute("/_authenticated/tenants/")({
  validateSearch: portalTenantsSearchSchema,
  beforeLoad: async () => {
    const user = useAuthStore.getState().user;
    const actor = toConsoleActor(user);
    if (user && isPlatformActor(actor)) {
      throw redirect({ to: "/platform/tenants" });
    }
    if (user && shouldRedirectToOwnerOnboarding(actor, 0)) {
      const page = await listMyTenants({ page: 0, pageSize: 1 });
      if (page.total === 0) {
        throw redirect({ to: PLATFORM_ONBOARDING_PATH });
      }
    }
  },
  component: PortalTenantsRouteComponent,
});
