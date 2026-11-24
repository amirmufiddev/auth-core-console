import { createFileRoute, redirect } from "@tanstack/react-router";
import { isPlatformActor } from "@/lib/console-shell";
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
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const actor = {
      role: user?.role ?? null,
      tenantId: null,
    };
    if (user && isPlatformActor(actor)) {
      throw redirect({ to: "/platform/tenants" });
    }
  },
  component: PortalTenantsRouteComponent,
});
