import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantVerify2FAPage } from "@/features/tenant-auth/TenantAuthPages";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantVerify2FARoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  return (
    <TenantVerify2FAPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={search.redirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/verify-2fa")({
  validateSearch: searchSchema,
  component: TenantVerify2FARoute,
});
