import { createFileRoute } from "@tanstack/react-router";
import { canPlatform } from "@/lib/console-shell";
import { AdminFeatureTierMatrixPage } from "@/features/admin-tiers/AdminFeatureTierMatrixPage";
import { UnauthorizedState } from "@/components/layout/ShellState";
import { Route as PlatformRoute } from "./route";

export const Route = createFileRoute("/_authenticated/platform/tiers")({
  component: function TiersRoute() {
    const { roles } = PlatformRoute.useRouteContext();
    if (!canPlatform(roles, "tier", "read")) {
      return <UnauthorizedState homeHref="/platform" />;
    }
    return <AdminFeatureTierMatrixPage />;
  },
});