import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function readUtf8(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function listFilesRecursive(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function extractSection(source, startMarker, endMarker) {
  const startIdx = source.indexOf(startMarker);
  assert.ok(startIdx !== -1, `Marker "${startMarker}" tidak ditemukan`);
  const endIdx = endMarker
    ? source.indexOf(endMarker, startIdx)
    : source.length;
  assert.ok(endIdx !== -1, `Marker akhir "${endMarker}" tidak ditemukan`);
  return source.slice(startIdx, endIdx);
}

function extractPlatformNavHrefs(menusSource) {
  const slice = extractSection(
    menusSource,
    "export const platformNav",
    "export const menusConfig",
  );
  return Array.from(slice.matchAll(/href:\s*"([^"]+)"/g)).map((m) => m[1]);
}

test("platformNav terdaftar dan sinkron dengan menusConfig", () => {
  const menusSource = readUtf8("src/config/menus.ts");
  const platformHrefs = extractPlatformNavHrefs(menusSource);

  const configSlice = extractSection(
    menusSource,
    "export const menusConfig",
    "export function tenantNav",
  );

  assert.ok(platformHrefs.length >= 10, "platformNav harus memuat menu shell");
  assert.match(configSlice, /child:\s*platformNav/);
  assert.match(configSlice, /modern:\s*platformNav/);
  assert.match(configSlice, /classic:\s*platformNav/);

  for (const required of [
    "/platform",
    "/platform/tenants",
    "/platform/tiers",
    "/platform/billing",
    "/platform/staff",
    "/platform/roles",
    "/platform/sessions",
    "/platform/audit",
    "/platform/auth-features",
    "/platform/account",
  ]) {
    assert.ok(
      platformHrefs.includes(required),
      `Menu platform harus mendaftarkan ${required}`,
    );
  }

  for (const removed of [
    "/users",
    "/organizations",
    "/api-keys",
    "/dashboard",
    "/admin-tenants",
  ]) {
    assert.equal(
      platformHrefs.includes(removed),
      false,
      `Menu platform tidak boleh mendaftarkan ${removed}`,
    );
  }
});

test("tenantNav memasang sembilan menu di bawah id tenant", () => {
  const source = readUtf8("src/config/menus.ts");
  assert.match(source, /export function tenantNav\(tenantId: string\)/);
  for (const suffix of [
    "",
    "/settings",
    "/features",
    "/oauth-clients",
    "/api-keys",
    "/users",
    "/organizations",
    "/billing",
    "/account",
  ]) {
    assert.match(
      source,
      new RegExp(
        "`/tenants/\\$\\{tenantId\\}" + suffix.replace("/", "\\/") + "`",
      ),
    );
  }
});

test("matriks role platform menyembunyikan apiKey, oauthClient, dan sso", () => {
  const source = readUtf8("src/lib/rbac.ts");
  for (const resource of ["apiKey", "oauthClient", "sso"]) {
    const block = source.slice(source.indexOf(`resource: "${resource}"`));
    assert.match(block, /shownInPlatformMatrix:\s*false/);
  }
  assert.match(source, /title: "Staf platform"/);
  assert.match(source, /title: "Direktori tenant & billing"/);
  assert.match(source, /title: "Plugin layanan & matriks tier"/);
});

test("setiap href non-platform di menus.ts memiliki file route di src/routes/_authenticated/", () => {
  const menusSource = readUtf8("src/config/menus.ts");
  const allHrefs = Array.from(menusSource.matchAll(/href:\s*"([^"]+)"/g)).map(
    (m) => m[1],
  );
  const uniqueHrefs = Array.from(new Set(allHrefs)).filter(
    (href) => !href.startsWith("/platform"),
  );

  for (const href of uniqueHrefs) {
    const slug = href.replace(/^\//, "");
    const flatRouteFile = path.join(
      ROOT,
      "src/routes/_authenticated",
      `${slug}.tsx`,
    );
    const indexRouteFile = path.join(
      ROOT,
      "src/routes/_authenticated",
      slug,
      "index.tsx",
    );
    assert.ok(
      fs.existsSync(flatRouteFile) || fs.existsSync(indexRouteFile),
      `File route tidak ditemukan untuk menu ${href}: ${flatRouteFile} atau ${indexRouteFile}`,
    );
  }

  const tenantDetailRouteFile = path.join(
    ROOT,
    "src/routes/_authenticated/tenants/$tenantId.tsx",
  );
  assert.ok(
    fs.existsSync(tenantDetailRouteFile),
    `File route detail tenant tidak ditemukan: ${tenantDetailRouteFile}`,
  );

  for (const authRoute of [
    "src/routes/_auth/consent.tsx",
    "src/routes/_auth/auth/accept-invitation.tsx",
    "src/routes/t/$tenantSlug/login.tsx",
    "src/routes/t/$tenantSlug/register.tsx",
    "src/routes/t/$tenantSlug/verify-2fa.tsx",
    "src/routes/t/$tenantSlug/consent.tsx",
    "src/routes/t/$tenantSlug/accept-invitation.tsx",
  ]) {
    const fullPath = path.join(ROOT, authRoute);
    assert.ok(
      fs.existsSync(fullPath),
      `File route auth tidak ditemukan: ${fullPath}`,
    );
  }
});

test("tidak ada import atau direktif Next.js terlarang di src/", () => {
  const files = listFilesRecursive(path.join(ROOT, "src")).filter((f) =>
    /\.(ts|tsx)$/.test(f),
  );
  const forbiddenPatterns = [
    /from\s+["']next\//,
    /from\s+["']next-safe-action/,
    /from\s+["']next-themes/,
    /["']use client["']/,
    /["']use server["']/,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(content),
        false,
        `Pola Next.js terlarang (${pattern}) ditemukan di ${path.relative(ROOT, file)}`,
      );
    }
  }
});

test("katalog fitur Better Auth tidak memiliki duplikasi ID dan semua dependency valid", () => {
  const configSource = readUtf8("src/config/better-auth.config.ts");
  const idMatches = Array.from(
    configSource.matchAll(/^\s{4}id:\s*"([^"]+)"/gm),
  ).map((m) => m[1]);

  const uniqueIds = new Set(idMatches);
  assert.equal(
    uniqueIds.size,
    idMatches.length,
    "Terdapat ID fitur duplikat di better-auth.config.ts",
  );
  assert.ok(uniqueIds.size >= 40, "Katalog fitur Better Auth harus lengkap");

  const depBlocks = Array.from(
    configSource.matchAll(/dependencies:\s*\[([^\]]+)\]/g),
  );
  for (const block of depBlocks) {
    const deps = Array.from(block[1].matchAll(/"([^"]+)"/g)).map((m) => m[1]);
    for (const dep of deps) {
      assert.ok(
        uniqueIds.has(dep),
        `Dependency "${dep}" tidak ditemukan di BETTER_AUTH_FEATURES`,
      );
    }
  }
});

const platformRoutes = [
  "src/routes/_authenticated/platform/route.tsx",
  "src/routes/_authenticated/platform/index.tsx",
  "src/routes/_authenticated/platform/tenants.tsx",
  "src/routes/_authenticated/platform/tiers.tsx",
  "src/routes/_authenticated/platform/billing.tsx",
  "src/routes/_authenticated/platform/staff.tsx",
  "src/routes/_authenticated/platform/roles.tsx",
  "src/routes/_authenticated/platform/sessions.tsx",
  "src/routes/_authenticated/platform/audit.tsx",
  "src/routes/_authenticated/platform/auth-features.tsx",
  "src/routes/_authenticated/platform/account.tsx",
];

test("file route platform shell terdaftar", () => {
  for (const route of platformRoutes) {
    assert.ok(
      fs.existsSync(path.join(ROOT, route)),
      `File route platform tidak ditemukan: ${route}`,
    );
  }
});

test("Header tidak merender OrganizationSwitcher", () => {
  const headerSource = readUtf8("src/components/layout/Header.tsx");
  assert.doesNotMatch(headerSource, /<OrganizationSwitcher/);
});

test("komponen better-auth mandiri tidak memakai package better-auth-ui eksternal", () => {
  const pkgJson = JSON.parse(readUtf8("package.json"));
  const allDeps = {
    ...(pkgJson.dependencies ?? {}),
    ...(pkgJson.devDependencies ?? {}),
  };

  assert.equal(
    "@daveyplate/better-auth-ui" in allDeps,
    false,
    "Package @daveyplate/better-auth-ui tidak boleh terpasang",
  );
  assert.equal(
    "better-auth-ui" in allDeps,
    false,
    "Package better-auth-ui tidak boleh terpasang",
  );

  const files = listFilesRecursive(path.join(ROOT, "src")).filter((f) =>
    /\.(ts|tsx)$/.test(f),
  );
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    assert.equal(
      /from\s+["'](@daveyplate\/)?better-auth-ui/.test(content),
      false,
      `Import better-auth-ui eksternal ditemukan di ${path.relative(ROOT, file)}`,
    );
  }

  const barrelSource = readUtf8("src/components/better-auth/index.ts");
  for (const expectedExport of [
    "AuthUIProvider",
    "AuthView",
    "AccountView",
    "OrganizationView",
    "UserButton",
    "OrganizationSwitcher",
    "SignedIn",
    "SignedOut",
  ]) {
    assert.ok(
      barrelSource.includes(expectedExport),
      `Barrel src/components/better-auth/index.ts harus mengekspor ${expectedExport}`,
    );
  }
});