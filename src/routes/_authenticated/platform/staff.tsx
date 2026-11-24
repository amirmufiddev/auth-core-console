import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { UsersPage } from "@/features/users/UsersPage";
import {
  type UsersSearchParams,
  usersSearchSchema,
} from "@/features/users/schema";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

function StaffRouteComponent() {
  const { roles } = PlatformRoute.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!canPlatform(roles, "staff", "read")) {
    return <UnauthorizedState homeHref="/platform" />;
  }

  const handleUpdateSearch = (patch: Partial<UsersSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <UsersPage
      searchParams={search}
      onUpdateSearch={handleUpdateSearch}
      listScope="platform"
      pageTitle="Staf platform"
      pageDescription="Akun operator Auth Core. Pengguna aplikasi pelanggan tidak muncul di daftar ini."
    />
  );
}

export const Route = createFileRoute("/_authenticated/platform/staff")({
  validateSearch: usersSearchSchema,
  component: StaffRouteComponent,
});