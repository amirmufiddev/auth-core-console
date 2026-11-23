import { createFileRoute } from "@tanstack/react-router";
import { AdminTenantsPage } from "@/features/admin-tenants/AdminTenantsPage";
import {
  type AdminTenantsSearchParams,
  adminTenantsSearchSchema,
} from "@/features/admin-tenants/schema";

function AdminTenantsRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleUpdateSearch = (patch: Partial<AdminTenantsSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <AdminTenantsPage
      searchParams={search}
      onUpdateSearch={handleUpdateSearch}
    />
  );
}

export const Route = createFileRoute("/_authenticated/admin-tenants")({
  validateSearch: adminTenantsSearchSchema,
  component: AdminTenantsRouteComponent,
});
