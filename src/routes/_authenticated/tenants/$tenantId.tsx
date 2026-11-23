import { createFileRoute } from "@tanstack/react-router";
import { PortalTenantDetailPage } from "@/features/portal/PortalTenantDetailPage";

function PortalTenantDetailRouteComponent() {
  const { tenantId } = Route.useParams();
  return <PortalTenantDetailPage tenantId={tenantId} />;
}

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  component: PortalTenantDetailRouteComponent,
});
