import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantLoginPage } from "@/features/tenant-auth/TenantAuthPages";
import { sanitizeRelativeRedirect } from "@/lib/tenant-context";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantLoginRoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  const safeRedirect = search.redirect
    ? sanitizeRelativeRedirect(search.redirect)
    : undefined;
  return (
    <TenantLoginPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={safeRedirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/login")({
  validateSearch: searchSchema,
  component: TenantLoginRoute,
});
