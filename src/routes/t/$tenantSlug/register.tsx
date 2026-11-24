import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantRegisterPage } from "@/features/tenant-auth/TenantAuthPages";
import { sanitizeRelativeRedirect } from "@/lib/tenant-context";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantRegisterRoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  const safeRedirect = search.redirect
    ? sanitizeRelativeRedirect(search.redirect)
    : undefined;
  return (
    <TenantRegisterPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={safeRedirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/register")({
  validateSearch: searchSchema,
  component: TenantRegisterRoute,
});
