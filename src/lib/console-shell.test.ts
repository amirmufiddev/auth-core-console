import { describe, expect, it } from "bun:test";
import {
  canPlatform,
  filterNav,
  isPlatformActor,
  redirectLegacyPath,
  resolveConsoleHome,
  resolveTenantMode,
} from "./console-shell";

const platform = { role: "super_admin", tenantId: null };
const owner = { role: "user", tenantId: null };
const blank = { role: null, tenantId: null };
const endUser = { role: null, tenantId: "ten_1" };

describe("console shell", () => {
  it("treats a non-user platform slug as a platform actor", () => {
    expect(isPlatformActor(platform)).toBe(true);
    expect(isPlatformActor({ role: "user,security_admin", tenantId: null })).toBe(true);
    expect(isPlatformActor(owner)).toBe(false);
    expect(isPlatformActor(blank)).toBe(false);
    expect(isPlatformActor(endUser)).toBe(false);
  });

  it("matches PlatformPermissionGuard wildcards", () => {
    expect(canPlatform([{ slug: "a", permissions: { organization: ["read"] } }], "organization", "read")).toBe(true);
    expect(canPlatform([{ slug: "a", permissions: { organization: ["*"] } }], "organization", "update")).toBe(true);
    expect(canPlatform([{ slug: "a", permissions: { "*": ["read"] } }], "auditLog", "read")).toBe(true);
    expect(canPlatform([{ slug: "a", permissions: { user: ["read"] } }], "organization", "read")).toBe(false);
  });

  it("resolves the login home", () => {
    expect(resolveConsoleHome({ actor: platform, ownedTenantIds: [] })).toBe("/platform");
    expect(resolveConsoleHome({ actor: owner, ownedTenantIds: ["ten_1"] })).toBe("/tenants/ten_1");
    expect(resolveConsoleHome({ actor: owner, ownedTenantIds: ["ten_1", "ten_2"] })).toBe("/tenants");
    expect(resolveConsoleHome({ actor: blank, ownedTenantIds: [] })).toBe("/tenants");
  });

  it("never gives a platform actor owner write mode", () => {
    expect(resolveTenantMode({ isPlatform: true, portalStatus: "owner", canReadTenants: true })).toBe("support");
    expect(resolveTenantMode({ isPlatform: true, portalStatus: "forbidden", canReadTenants: false })).toBe("denied");
    expect(resolveTenantMode({ isPlatform: true, portalStatus: "not_found", canReadTenants: true })).toBe("not_found");
    expect(resolveTenantMode({ isPlatform: false, portalStatus: "owner", canReadTenants: false })).toBe("owner");
    expect(resolveTenantMode({ isPlatform: false, portalStatus: "forbidden", canReadTenants: false })).toBe("denied");
  });

  it("filters menu items by read permission and keeps overview", () => {
    const items = [
      { title: "Overview", href: "/platform" },
      { title: "Tenants", href: "/platform/tenants", permission: { resource: "organization", action: "read" } },
      { title: "Staf", href: "/platform/staff", permission: { resource: "user", action: "read" } },
    ];
    expect(filterNav(items, (resource) => resource === "user").map((item) => item.href)).toEqual([
      "/platform",
      "/platform/staff",
    ]);
  });

  it("redirects legacy paths from the spec table", () => {
    expect(redirectLegacyPath({ path: "/users", actor: platform, ownedTenantIds: [] })).toBe("/platform/staff");
    expect(redirectLegacyPath({ path: "/tenants", actor: platform, ownedTenantIds: [] })).toBe("/platform/tenants");
    expect(redirectLegacyPath({ path: "/tenants/ten_9", actor: platform, ownedTenantIds: [] })).toBe("/tenants/ten_9");
    expect(redirectLegacyPath({ path: "/api-keys", actor: platform, ownedTenantIds: [] })).toBe("/platform");
    expect(redirectLegacyPath({ path: "/users", actor: owner, ownedTenantIds: ["ten_1"] })).toBe("/tenants/ten_1/users");
    expect(redirectLegacyPath({ path: "/roles", actor: owner, ownedTenantIds: ["ten_1", "ten_2"] })).toBe("/tenants");
    expect(redirectLegacyPath({ path: "/account", actor: owner, ownedTenantIds: [] })).toBe("/tenants");
    expect(redirectLegacyPath({ path: "/account", actor: owner, ownedTenantIds: ["ten_1"] })).toBe("/tenants/ten_1/account");
  });
});