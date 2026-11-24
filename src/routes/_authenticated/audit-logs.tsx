import { createFileRoute, redirect } from "@tanstack/react-router";
import { listMyTenants } from "@/api/tenant-service";
import {
  isPlatformActor,
  redirectLegacyPath,
  toConsoleActor,
} from "@/lib/console-shell";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  beforeLoad: async () => {
    const actor = toConsoleActor(useAuthStore.getState().user);
    const owned = isPlatformActor(actor)
      ? []
      : (await listMyTenants({ page: 0, pageSize: 2 })).items.map(
          (tenant) => tenant.id,
        );
    throw redirect({
      href: redirectLegacyPath({
        path: "/audit-logs",
        actor,
        ownedTenantIds: owned,
      }),
    });
  },
});