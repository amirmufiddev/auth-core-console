import type { ReactNode } from "react";
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
import { AppSidebar } from "@/components/layout/AppSidebar";

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

export function PlatformShell({
  roles,
  children,
}: {
  roles: ActorRoleGrant[];
  children: ReactNode;
}) {
  const items = filterPlatformNavItems(roles);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] gap-0 lg:-mx-2">
      <AppSidebar items={items} logoHref="/platform" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}