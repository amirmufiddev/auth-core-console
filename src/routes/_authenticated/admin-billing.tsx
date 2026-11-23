import { createFileRoute } from "@tanstack/react-router";
import { AdminBillingPage } from "@/features/admin-billing/AdminBillingPage";
import {
  type AdminBillingSearchParams,
  adminBillingSearchSchema,
} from "@/features/admin-billing/schema";

function AdminBillingRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

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

export const Route = createFileRoute("/_authenticated/admin-billing")({
  validateSearch: adminBillingSearchSchema,
  component: AdminBillingRouteComponent,
});
