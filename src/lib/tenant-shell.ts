import type { QueryClient } from "@tanstack/react-query";
import {
  ensureActorPermissions,
  fetchActorPermissions,
} from "@/api/actor-permissions";
import { ApiRequestError, isExternalBackendConfigured } from "@/api/client";
import {
  adminGetTenant,
  getMyTenant,
  type TenantRecord,
} from "@/api/tenant-service";
import {
  canPlatform,
  isPlatformActor,
  resolveTenantMode,
  type ConsoleActor,
  type TenantShellMode,
} from "@/lib/console-shell";

function isTenantNotFoundError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("tidak ditemukan");
}

export async function loadTenantShell(
  tenantId: string,
  actor: ConsoleActor,
  queryClient?: QueryClient,
): Promise<{ mode: TenantShellMode; tenant: TenantRecord | null }> {
  const isPlatform = isPlatformActor(actor);
  let canReadTenants = false;

  if (isPlatform) {
    const roles = queryClient
      ? await ensureActorPermissions(queryClient)
      : (await fetchActorPermissions()).roles;
    canReadTenants = canPlatform(roles, "tenant", "read");
  }

  let portalStatus: "owner" | "forbidden" | "not_found" = "not_found";
  let tenant: TenantRecord | null = null;

  try {
    tenant = await getMyTenant(tenantId);
    portalStatus = isPlatform ? "forbidden" : "owner";
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) {
        portalStatus = "not_found";
      } else if (err.status === 403) {
        try {
          tenant = await adminGetTenant(tenantId);
          portalStatus = "forbidden";
        } catch (adminErr) {
          if (adminErr instanceof ApiRequestError && adminErr.status === 404) {
            portalStatus = "not_found";
          } else if (
            !isExternalBackendConfigured() &&
            isTenantNotFoundError(adminErr)
          ) {
            portalStatus = "not_found";
          } else {
            throw adminErr;
          }
        }
      } else {
        throw err;
      }
    } else if (isTenantNotFoundError(err)) {
      if (isPlatform) {
        try {
          tenant = await adminGetTenant(tenantId);
          portalStatus = "forbidden";
        } catch (adminErr) {
          portalStatus = "not_found";
        }
      } else {
        portalStatus = "not_found";
      }
    } else {
      throw err;
    }
  }

  const mode = resolveTenantMode({
    isPlatform,
    portalStatus,
    canReadTenants,
  });

  return { mode, tenant };
}