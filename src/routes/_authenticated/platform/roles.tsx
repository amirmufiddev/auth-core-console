import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { RolesPage } from "@/features/roles/RolesPage";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

export const Route = createFileRoute("/_authenticated/platform/roles")({
  component: function RolesRoute() {
    const { roles } = PlatformRoute.useRouteContext();
    if (!canPlatform(roles, "role", "read")) {
      return <UnauthorizedState homeHref="/platform" />;
    }
    return <RolesPage />;
  },
});