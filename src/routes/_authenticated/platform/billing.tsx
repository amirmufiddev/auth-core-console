import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { AdminBillingPage } from "@/features/admin-billing/AdminBillingPage";
import {
  type AdminBillingSearchParams,
  adminBillingSearchSchema,
} from "@/features/admin-billing/schema";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

function BillingRouteComponent() {
  const { roles } = PlatformRoute.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!canPlatform(roles, "billing", "read")) {
    return <UnauthorizedState homeHref="/platform" />;
  }

  const handleUpdateSearch = (patch: Partial<AdminBillingSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <AdminBillingPage
      searchParams={search}
      onUpdateSearch={handleUpdateSearch}
    />
  );
}

export const Route = createFileRoute("/_authenticated/platform/billing")({
  validateSearch: adminBillingSearchSchema,
  component: BillingRouteComponent,
});