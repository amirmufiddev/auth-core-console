import { Outlet, createFileRoute } from "@tanstack/react-router";

function TenantAcceptInvitationLayoutRoute() {
  return <Outlet />;
}

export const Route = createFileRoute("/t/$tenantSlug/accept-invitation")({
  component: TenantAcceptInvitationLayoutRoute,
});
