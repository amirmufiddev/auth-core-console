import { Outlet, createFileRoute } from "@tanstack/react-router";

function AcceptInvitationLayoutRoute() {
  return <Outlet />;
}

export const Route = createFileRoute("/_auth/auth/accept-invitation")({
  component: AcceptInvitationLayoutRoute,
});
