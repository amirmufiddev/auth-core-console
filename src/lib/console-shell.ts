export interface ConsoleActor {
  role: string | null;
  tenantId: string | null;
}

export interface ActorRoleGrant {
  slug: string;
  permissions: Record<string, string[]>;
}

export interface ConsoleMenuItem {
  title: string;
  href?: string;
  permission?: { resource: string; action: string };
  child?: ConsoleMenuItem[];
}

export type TenantShellMode = "owner" | "support" | "denied" | "not_found";

export function roleSlugs(role: string | null): string[] {
  return (role ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export function isPlatformActor(actor: ConsoleActor): boolean {
  if (actor.tenantId) return false;
  return roleSlugs(actor.role).some((slug) => slug !== "user");
}

export function canPlatform(
  roles: ActorRoleGrant[],
  resource: string,
  action: string,
): boolean {
  return roles.some((role) => {
    const matrix = role.permissions ?? {};
    const resourceActions = matrix[resource];
    const wildcardActions = matrix["*"];
    return (
      (Array.isArray(resourceActions) &&
        (resourceActions.includes(action) || resourceActions.includes("*"))) ||
      (Array.isArray(wildcardActions) &&
        (wildcardActions.includes(action) || wildcardActions.includes("*")))
    );
  });
}

export function resolveConsoleHome(input: {
  actor: ConsoleActor;
  ownedTenantIds: string[];
}): string {
  if (isPlatformActor(input.actor)) return "/platform";
  if (input.ownedTenantIds.length === 1) {
    return `/tenants/${input.ownedTenantIds[0]}`;
  }
  return "/tenants";
}

export function resolveTenantMode(input: {
  isPlatform: boolean;
  portalStatus: "owner" | "forbidden" | "not_found";
  canReadTenants: boolean;
}): TenantShellMode {
  if (input.portalStatus === "not_found") return "not_found";
  if (input.isPlatform) {
    return input.canReadTenants ? "support" : "denied";
  }
  if (input.portalStatus === "owner") return "owner";
  return "denied";
}

const PLATFORM_EXACT: Record<string, string> = {
  "/dashboard": "/platform",
  "/users": "/platform/staff",
  "/roles": "/platform/roles",
  "/sessions": "/platform/sessions",
  "/audit-logs": "/platform/audit",
  "/auth-features": "/platform/auth-features",
  "/api-keys": "/platform",
  "/organizations": "/platform",
  "/admin-tenants": "/platform/tenants",
  "/admin-tiers": "/platform/tiers",
  "/admin-billing": "/platform/billing",
  "/account": "/platform/account",
};

export function redirectLegacyPath(input: {
  path: string;
  actor: ConsoleActor;
  ownedTenantIds: string[];
}): string {
  const path = input.path.split("?")[0] ?? input.path;
  if (isPlatformActor(input.actor)) {
    if (path === "/tenants" || path === "/tenants/") return "/platform/tenants";
    if (path.startsWith("/tenants/")) return path;
    return PLATFORM_EXACT[path] ?? "/platform";
  }

  const only =
    input.ownedTenantIds.length === 1 ? input.ownedTenantIds[0] : null;
  if (path === "/users" && only) return `/tenants/${only}/users`;
  if (path === "/api-keys" && only) return `/tenants/${only}/api-keys`;
  if (path === "/organizations" && only) {
    return `/tenants/${only}/organizations`;
  }
  if (path === "/account") {
    return only ? `/tenants/${only}/account` : "/tenants";
  }
  if (path === "/tenants" || path.startsWith("/tenants/")) return path;
  return resolveConsoleHome(input);
}

export function filterNav(
  items: ConsoleMenuItem[],
  can: (resource: string, action: string) => boolean,
): ConsoleMenuItem[] {
  return items.flatMap((item) => {
    if (item.permission && !can(item.permission.resource, item.permission.action)) {
      return [];
    }
    if (item.child) {
      const child = filterNav(item.child, can);
      if (child.length === 0 && !item.href) return [];
      return [{ ...item, child }];
    }
    return [item];
  });
}