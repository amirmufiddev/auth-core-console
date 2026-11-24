import type { ReactNode } from "react";
import { useMatches } from "@tanstack/react-router";
import {
  canPlatform,
  type ActorRoleGrant,
} from "@/lib/console-shell";
import { Route as TenantRoute } from "@/routes/_authenticated/tenants/$tenantId/route";

function usePlatformRoles(): ActorRoleGrant[] {
  const matches = useMatches();
  for (const match of matches) {
    const ctx = match.context as {
      roles?: ActorRoleGrant[];
      supportRoles?: ActorRoleGrant[];
    };
    if (ctx.roles?.length) {
      return ctx.roles;
    }
    if (ctx.supportRoles?.length) {
      return ctx.supportRoles;
    }
  }
  return [];
}

export function Can({
  resource,
  action,
  children,
}: {
  resource: string;
  action: string;
  children: ReactNode;
}) {
  const roles = usePlatformRoles();
  if (!canPlatform(roles, resource, action)) {
    return null;
  }
  return <>{children}</>;
}

export function OwnerOnly({ children }: { children: ReactNode }) {
  const { mode } = TenantRoute.useRouteContext();
  if (mode !== "owner") {
    return null;
  }
  return <>{children}</>;
}