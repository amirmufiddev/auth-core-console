import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TenantRegisterPage } from "@/features/tenant-auth/TenantAuthPages";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function TenantRegisterRoute() {
  const { tenantSlug } = Route.useParams();
  const search = Route.useSearch();
  return (
    <TenantRegisterPage
      tenantSlug={tenantSlug}
      mode="path"
      redirectTo={search.redirect}
    />
  );
}

export const Route = createFileRoute("/t/$tenantSlug/register")({
  validateSearch: searchSchema,
  component: TenantRegisterRoute,
});
