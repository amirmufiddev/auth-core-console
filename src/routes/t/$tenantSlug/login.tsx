import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantLoginPage } from "@/features/tenant-auth/TenantAuthPages";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantLoginRoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  return (
    <TenantLoginPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={search.redirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/login")({
  validateSearch: searchSchema,
  component: TenantLoginRoute,
});
