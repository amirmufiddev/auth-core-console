import type { ReactNode } from "react";
import type { ActorRoleGrant } from "@/lib/console-shell";

export function PlatformShell({
  children,
}: {
  roles?: ActorRoleGrant[];
  children: ReactNode;
}) {
  return <>{children}</>;
}