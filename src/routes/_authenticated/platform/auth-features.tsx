import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { AuthFeaturesPage } from "@/features/auth-features/AuthFeaturesPage";
import {
  type AuthFeaturesSearchParams,
  authFeaturesSearchSchema,
} from "@/features/audit-logs/schema";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

function AuthFeaturesRouteComponent() {
  const { roles } = PlatformRoute.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const allowed =
    canPlatform(roles, "authConfig", "read") ||
    canPlatform(roles, "authConfig", "configure");
  if (!allowed) {
    return <UnauthorizedState homeHref="/platform" />;
  }

  const handleUpdateSearch = (patch: Partial<AuthFeaturesSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <AuthFeaturesPage
      searchParams={search}
      onUpdateSearch={handleUpdateSearch}
    />
  );
}

export const Route = createFileRoute("/_authenticated/platform/auth-features")({
  validateSearch: authFeaturesSearchSchema,
  component: AuthFeaturesRouteComponent,
});