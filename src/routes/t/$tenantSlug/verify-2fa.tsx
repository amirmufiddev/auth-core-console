import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantVerify2FAPage } from "@/features/tenant-auth/TenantAuthPages";
import { sanitizeRelativeRedirect } from "@/lib/tenant-context";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantVerify2FARoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  const safeRedirect = search.redirect
    ? sanitizeRelativeRedirect(search.redirect)
    : undefined;
  return (
    <TenantVerify2FAPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={safeRedirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/verify-2fa")({
  validateSearch: searchSchema,
  component: TenantVerify2FARoute,
});
