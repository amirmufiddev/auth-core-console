import type { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import type { ActorRoleGrant } from "@/lib/console-shell";

export const ACTOR_PERMISSIONS_QUERY_KEY = ["actor-permissions"] as const;
export const ACTOR_PERMISSIONS_STALE_MS = 60_000;

export function fetchActorPermissions(): Promise<{ roles: ActorRoleGrant[] }> {
  return apiRequest<{ roles: ActorRoleGrant[] }>("/api/admin/me/permissions");
}

export async function ensureActorPermissions(
  queryClient: QueryClient,
): Promise<ActorRoleGrant[]> {
  const data = await queryClient.ensureQueryData({
    queryKey: ACTOR_PERMISSIONS_QUERY_KEY,
    queryFn: fetchActorPermissions,
    staleTime: ACTOR_PERMISSIONS_STALE_MS,
  });
  return data.roles;
}