import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { SessionsPage } from "@/features/sessions/SessionsPage";
import {
  type SessionsSearchParams,
  sessionsSearchSchema,
} from "@/features/audit-logs/schema";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

function SessionsRouteComponent() {
  const { roles } = PlatformRoute.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!canPlatform(roles, "session", "read")) {
    return <UnauthorizedState homeHref="/platform" />;
  }

  const handleUpdateSearch = (patch: Partial<SessionsSearchParams>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
      }),
    });
  };

  return (
    <SessionsPage searchParams={search} onUpdateSearch={handleUpdateSearch} />
  );
}

export const Route = createFileRoute("/_authenticated/platform/sessions")({
  validateSearch: sessionsSearchSchema,
  component: SessionsRouteComponent,
});