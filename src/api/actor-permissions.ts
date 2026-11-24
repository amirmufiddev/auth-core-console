import { apiRequest } from "@/api/client";
import type { ActorRoleGrant } from "@/lib/console-shell";

export function fetchActorPermissions(): Promise<{ roles: ActorRoleGrant[] }> {
  return apiRequest<{ roles: ActorRoleGrant[] }>("/api/admin/me/permissions");
}