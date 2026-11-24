import { useQuery } from "@tanstack/react-query";
import { useMatches, useRouterState } from "@tanstack/react-router";
import {
  ACTOR_PERMISSIONS_QUERY_KEY,
  ACTOR_PERMISSIONS_STALE_MS,
  fetchActorPermissions,
} from "@/api/actor-permissions";
import {
  ownerPortalNav,
  tenantNav,
  type MenuItemProps,
} from "@/config/menus";
import type { ActorRoleGrant } from "@/lib/console-shell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { filterPlatformNavItems } from "@/lib/filter-platform-nav";

function tenantIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/tenants\/([^/]+)/);
  return match?.[1] ?? null;
}

function platformRolesFromMatches(
  matches: ReturnType<typeof useMatches>,
): ActorRoleGrant[] | undefined {
  const platformMatch = matches.find(
    (m) => m.routeId === "/_authenticated/platform",
  );
  return (platformMatch?.context as { roles?: ActorRoleGrant[] } | undefined)
    ?.roles;
}

export function ConsoleSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();

  const isPlatform = pathname.startsWith("/platform");
  const tenantId = tenantIdFromPath(pathname);
  const isOwnerPortal =
    pathname === "/tenants" || pathname === "/tenants/";

  const rolesFromRoute = platformRolesFromMatches(matches);
  const permissionsQuery = useQuery({
    queryKey: ACTOR_PERMISSIONS_QUERY_KEY,
    queryFn: fetchActorPermissions,
    enabled: isPlatform && rolesFromRoute === undefined,
    staleTime: ACTOR_PERMISSIONS_STALE_MS,
  });

  const platformRoles = rolesFromRoute ?? permissionsQuery.data?.roles ?? [];

  let items: MenuItemProps[] = [];
  let logoHref = "/platform";

  if (isPlatform) {
    items = filterPlatformNavItems(platformRoles);
    logoHref = "/platform";
  } else if (tenantId) {
    items = tenantNav(tenantId);
    logoHref = `/tenants/${tenantId}`;
  } else if (isOwnerPortal) {
    items = ownerPortalNav;
    logoHref = "/tenants";
  }

  if (items.length === 0) {
    return null;
  }

  return <AppSidebar items={items} logoHref={logoHref} />;
}