import type {
  RbacPermissionOption,
  RbacResource,
  RbacResourceModule,
} from "@/config/platform-permissions";
import { RBAC_RESOURCE_MODULES } from "@/config/platform-permissions";

export type { RbacPermissionOption, RbacResource, RbacResourceModule };
export { RBAC_RESOURCE_MODULES };

export type RolePermissionMatrix = Partial<Record<RbacResource, string[]>>;

export interface RoleRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: RolePermissionMatrix;
  updatedAt: string;
}

export function countRolePermissions(
  permissions: RolePermissionMatrix,
): number {
  return Object.values(permissions).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );
}

export function getTotalAvailablePermissions(): number {
  return RBAC_RESOURCE_MODULES.filter((mod) => mod.shownInPlatformMatrix).reduce(
    (sum, mod) => sum + mod.permissions.length,
    0,
  );
}

export function hasPermission(
  rolePermissions: RolePermissionMatrix | undefined,
  resource: RbacResource,
  action: string,
): boolean {
  if (!rolePermissions) return false;
  return Boolean(rolePermissions[resource]?.includes(action));
}

export function generateAccessControlCode(roles: RoleRecord[]): string {
  const statementEntries = RBAC_RESOURCE_MODULES.map(
    (mod) =>
      `  ${mod.resource}: [${mod.permissions
        .map((p) => `"${p.action}"`)
        .join(", ")}],`,
  );

  const roleBlocks = roles.map((role) => {
    const perms = Object.entries(role.permissions)
      .filter(([, actions]) => actions && actions.length > 0)
      .map(
        ([res, actions]) =>
          `  ${res}: [${(actions ?? []).map((a) => `"${a}"`).join(", ")}],`,
      );
    return `export const ${role.slug.replace(/[^a-zA-Z0-9_]/g, "_")}Role = ac.newRole({\n${perms.join("\n")}\n});`;
  });

  return [
    `import { createAccessControl } from "better-auth/plugins/access";`,
    "",
    `export const statement = {`,
    ...statementEntries,
    `} as const;`,
    "",
    `export const ac = createAccessControl(statement);`,
    "",
    ...roleBlocks,
  ].join("\n");
}