import { apiRequest } from "@/api/client";

export type PermissionMap = Record<string, string[]>;

export interface CatalogResource {
  resource: string;
  displayName: string;
  description?: string;
  actions: Record<string, { displayName: string; description?: string }>;
}

export interface CatalogPermission {
  id: string;
  code: string;
  resource: string;
  action: string;
  displayName: string;
}

export interface OrganizationCatalog {
  resources: CatalogResource[];
  permissions: CatalogPermission[];
}

export interface OrganizationPermissionRecord {
  id: string;
  resource: string;
  action: string;
  code: string;
  actionDisplayName: string;
  actionDescription?: string;
  resourceDisplayName: string;
  resourceDescription?: string;
}

export interface OrganizationRoleTemplateRecord {
  roleName: string;
  permission: PermissionMap;
  permissionScopes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRoleRecord {
  id: string;
  organizationId: string;
  role: string;
  permission: PermissionMap;
  permissionScopes: Record<string, string>;
  createdAt: string;
}

export interface UpsertPermissionInput {
  resource: string;
  action: string;
  actionDisplayName: string;
  resourceDisplayName: string;
  actionDescription?: string;
  resourceDescription?: string;
}

export interface UpsertRoleGrantInput {
  role: string;
  permission: PermissionMap;
}

function tenantPath(tenantId: string, suffix: string): string {
  return `/api/portal/tenants/${encodeURIComponent(tenantId)}${suffix}`;
}

export function organizationScopes(
  permission: PermissionMap,
): Record<string, string> {
  const scopes: Record<string, string> = {};
  for (const [resource, actions] of Object.entries(permission)) {
    for (const action of actions) {
      scopes[`${resource}:${action}`] = "organization";
    }
  }
  return scopes;
}

export function listOrganizationCatalog(
  tenantId: string,
): Promise<OrganizationCatalog> {
  return apiRequest(tenantPath(tenantId, "/permissions"));
}

export function createOrganizationPermission(
  tenantId: string,
  input: UpsertPermissionInput,
): Promise<OrganizationPermissionRecord> {
  return apiRequest(tenantPath(tenantId, "/permissions"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationPermission(
  tenantId: string,
  permissionId: string,
  input: {
    actionDisplayName?: string;
    actionDescription?: string;
    resourceDisplayName?: string;
    resourceDescription?: string;
  },
): Promise<OrganizationPermissionRecord> {
  return apiRequest(
    tenantPath(tenantId, `/permissions/${encodeURIComponent(permissionId)}`),
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export function deleteOrganizationPermission(
  tenantId: string,
  permissionId: string,
): Promise<void> {
  return apiRequest(
    tenantPath(tenantId, `/permissions/${encodeURIComponent(permissionId)}`),
    { method: "DELETE" },
  );
}

export function listOrganizationRoleTemplates(
  tenantId: string,
): Promise<OrganizationRoleTemplateRecord[]> {
  return apiRequest(tenantPath(tenantId, "/role-templates"));
}

export function createOrganizationRoleTemplate(
  tenantId: string,
  input: UpsertRoleGrantInput & { roleName: string },
): Promise<OrganizationRoleTemplateRecord> {
  return apiRequest(tenantPath(tenantId, "/role-templates"), {
    method: "POST",
    body: JSON.stringify({
      roleName: input.roleName,
      permission: input.permission,
      permissionScopes: organizationScopes(input.permission),
    }),
  });
}

export function updateOrganizationRoleTemplate(
  tenantId: string,
  roleName: string,
  input: UpsertRoleGrantInput,
): Promise<OrganizationRoleTemplateRecord> {
  return apiRequest(
    tenantPath(tenantId, `/role-templates/${encodeURIComponent(roleName)}`),
    {
      method: "PATCH",
      body: JSON.stringify({
        roleName,
        permission: input.permission,
        permissionScopes: organizationScopes(input.permission),
      }),
    },
  );
}

export function deleteOrganizationRoleTemplate(
  tenantId: string,
  roleName: string,
): Promise<void> {
  return apiRequest(
    tenantPath(tenantId, `/role-templates/${encodeURIComponent(roleName)}`),
    { method: "DELETE" },
  );
}

export function listOrganizationRoles(
  tenantId: string,
  organizationId: string,
): Promise<OrganizationRoleRecord[]> {
  return apiRequest(
    tenantPath(
      tenantId,
      `/organizations/${encodeURIComponent(organizationId)}/roles`,
    ),
  );
}

export function createOrganizationRole(
  tenantId: string,
  organizationId: string,
  input: UpsertRoleGrantInput,
): Promise<OrganizationRoleRecord> {
  return apiRequest(
    tenantPath(
      tenantId,
      `/organizations/${encodeURIComponent(organizationId)}/roles`,
    ),
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        permissionScopes: organizationScopes(input.permission),
      }),
    },
  );
}

export function updateOrganizationRole(
  tenantId: string,
  organizationId: string,
  roleId: string,
  input: UpsertRoleGrantInput,
): Promise<OrganizationRoleRecord> {
  return apiRequest(
    tenantPath(
      tenantId,
      `/organizations/${encodeURIComponent(organizationId)}/roles/${encodeURIComponent(roleId)}`,
    ),
    {
      method: "PATCH",
      body: JSON.stringify({
        ...input,
        permissionScopes: organizationScopes(input.permission),
      }),
    },
  );
}

export function deleteOrganizationRole(
  tenantId: string,
  organizationId: string,
  roleId: string,
): Promise<void> {
  return apiRequest(
    tenantPath(
      tenantId,
      `/organizations/${encodeURIComponent(organizationId)}/roles/${encodeURIComponent(roleId)}`,
    ),
    { method: "DELETE" },
  );
}
