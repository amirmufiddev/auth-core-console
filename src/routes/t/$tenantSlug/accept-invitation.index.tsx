import { createFileRoute } from "@tanstack/react-router";
import { TenantAcceptInvitationPage } from "@/features/tenant-auth/TenantAuthPages";

function TenantAcceptInvitationIndexRoute() {
  const { tenantSlug } = Route.useParams();
  return <TenantAcceptInvitationPage tenantSlug={tenantSlug} mode="path" />;
}

export const Route = createFileRoute("/t/$tenantSlug/accept-invitation/")({
  component: TenantAcceptInvitationIndexRoute,
});
