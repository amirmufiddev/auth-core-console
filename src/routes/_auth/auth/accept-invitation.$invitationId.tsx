import { createFileRoute } from "@tanstack/react-router";
import { AcceptInvitationPage } from "@/features/auth/AcceptInvitationPage";
import { TenantAcceptInvitationPage } from "@/features/tenant-auth/TenantAuthPages";
import { resolveTenantFromHostname } from "@/lib/tenant-context";

function AcceptInvitationParamRoute() {
  const { invitationId } = Route.useParams();
  const tenant = resolveTenantFromHostname();

  if (tenant.mode === "subdomain" && tenant.tenantSlug) {
    return (
      <TenantAcceptInvitationPage
        tenantSlug={tenant.tenantSlug}
        mode="subdomain"
        invitationId={invitationId}
        embedded
      />
    );
  }

  return <AcceptInvitationPage invitationId={invitationId} />;
}

export const Route = createFileRoute(
  "/_auth/auth/accept-invitation/$invitationId",
)({
  component: AcceptInvitationParamRoute,
});
