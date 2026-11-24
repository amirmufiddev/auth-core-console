import { createFileRoute } from "@tanstack/react-router";
import { PlatformHomePage } from "@/features/dashboard/PlatformHomePage";
import { Route as PlatformRoute } from "./route";

export const Route = createFileRoute("/_authenticated/platform/")({
  component: function PlatformIndexRoute() {
    const { roles } = PlatformRoute.useRouteContext();
    return <PlatformHomePage roles={roles} />;
  },
});
