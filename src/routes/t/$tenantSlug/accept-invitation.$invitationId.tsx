import { createFileRoute } from "@tanstack/react-router";
import { TenantAcceptInvitationPage } from "@/features/tenant-auth/TenantAuthPages";

function TenantAcceptInvitationParamRoute() {
  const { tenantSlug, invitationId } = Route.useParams();
  return (
    <TenantAcceptInvitationPage
      tenantSlug={tenantSlug}
      mode="path"
      invitationId={invitationId}
    />
  );
}

export const Route = createFileRoute(
  "/t/$tenantSlug/accept-invitation/$invitationId",
)({
  component: TenantAcceptInvitationParamRoute,
});
