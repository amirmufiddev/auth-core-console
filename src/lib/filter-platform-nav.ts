import { platformNav, type MenuItemProps } from "@/config/menus";
import { type ActorRoleGrant, canPlatform } from "@/lib/console-shell";

function filterMenuItems(
  items: MenuItemProps[],
  can: (resource: string, action: string) => boolean,
): MenuItemProps[] {
  return items.flatMap((item) => {
    if (
      item.permission &&
      !can(item.permission.resource, item.permission.action)
    ) {
      return [];
    }
    if (item.child?.length) {
      const child = filterMenuItems(item.child, can);
      if (child.length === 0 && !item.href) return [];
      return [{ ...item, child }];
    }
    return [item];
  });
}

export function filterPlatformNavItems(
  roles: ActorRoleGrant[],
): MenuItemProps[] {
  const can = (resource: string, action: string) =>
    canPlatform(roles, resource, action);
  const authFeaturesItem = platformNav.find(
    (item) => item.href === "/platform/auth-features",
  );
  const withoutAuthFeatures = platformNav.filter(
    (item) => item.href !== "/platform/auth-features",
  );
  const filtered = filterMenuItems(withoutAuthFeatures, can);
  if (
    authFeaturesItem &&
    (can("authConfig", "read") || can("authConfig", "configure"))
  ) {
    const accountIdx = filtered.findIndex(
      (item) => item.href === "/platform/account",
    );
    if (accountIdx >= 0) {
      return [
        ...filtered.slice(0, accountIdx),
        authFeaturesItem,
        ...filtered.slice(accountIdx),
      ];
    }
    return [...filtered, authFeaturesItem];
  }
  return filtered;
}