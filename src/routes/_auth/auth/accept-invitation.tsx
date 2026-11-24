import { createFileRoute } from "@tanstack/react-router";
import { AcceptInvitationPage } from "@/features/auth/AcceptInvitationPage";

function AcceptInvitationRoute() {
  return <AcceptInvitationPage />;
}

export const Route = createFileRoute("/_auth/auth/accept-invitation")({
  component: AcceptInvitationRoute,
});
