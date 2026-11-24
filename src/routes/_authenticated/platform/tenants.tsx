import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { AdminTenantsPage } from "@/features/admin-tenants/AdminTenantsPage";
import {
  type AdminTenantsSearchParams,
  adminTenantsSearchSchema,
} from "@/features/admin-tenants/schema";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

function TenantsRouteComponent() {
  const { roles } = PlatformRoute.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!canPlatform(roles, "tenant", "read")) {
    return <UnauthorizedState homeHref="/platform" />;
  }

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

export const Route = createFileRoute("/_authenticated/platform/tenants")({
  validateSearch: adminTenantsSearchSchema,
  component: TenantsRouteComponent,
});