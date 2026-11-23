import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantsPage } from "@/features/portal/PortalTenantsPage";
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
  component: PortalTenantsRouteComponent,
});
