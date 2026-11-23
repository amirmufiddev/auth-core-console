import { type PaginatedResult } from "@/api/auth-service";
import { apiRequest, isExternalBackendConfigured } from "@/api/client";

export type TenantStatus = "active" | "suspended";

export type TenantBillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "suspended"
  | "manual_invoice";

export type BillingRecordStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paid"
  | "manual_invoice"
  | "void";

export type PortalOAuthClientType =
  | "oidc-confidential"
  | "oidc-public"
  | "mcp-client";

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  tierId: string;
  status: TenantStatus;
  billingStatus: TenantBillingStatus;
  configVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord {
  id: string;
  tenantId: string;
  tierId: string;
  status: BillingRecordStatus;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  note: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface PortalOAuthClientRecord {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  type: PortalOAuthClientType;
  redirectUris: string[];
  scopes: string[];
  pkceRequired: boolean;
  active: boolean;
  createdAt: string;
  plainClientSecret?: string;
}

export interface PortalBillingSummary {
  tenantId: string;
  tierId: string;
  billingStatus: TenantBillingStatus;
  items: BillingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TenantTierOption {
  id: string;
  name: string;
  description: string;
}

export const TENANT_TIER_OPTIONS: TenantTierOption[] = [
  {
    id: "tier_free",
    name: "Free",
    description: "Autentikasi inti & maksimal 1 OAuth client.",
  },
  {
    id: "tier_basic",
    name: "Basic",
    description: "2FA, magic link, email OTP, API key & social dasar.",
  },
  {
    id: "tier_business",
    name: "Business",
    description: "Semua social provider, passkey, SIWE & multi OAuth client.",
  },
  {
    id: "tier_enterprise",
    name: "Enterprise",
    description: "SSO, SCIM, MCP, Agent Auth & kapabilitas penuh.",
  },
];

export const FREE_TIER_ID = "tier_free";
export const FREE_TIER_MAX_OAUTH_CLIENTS = 1;

export const RESERVED_TENANT_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "console",
  "dashboard",
  "docs",
  "health",
  "login",
  "oauth",
  "portal",
  "public",
  "root",
  "static",
  "status",
  "system",
  "tenant",
  "tenants",
  "www",
]);

const TENANT_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const DANGEROUS_URI_SCHEMES = new Set([
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
  "about:",
]);
const CUSTOM_SCHEME_REGEX = /^[a-z][a-z0-9+.-]*:$/;

export function isValidTenantSlug(rawSlug: string): boolean {
  const slug = rawSlug.trim().toLowerCase();
  return !RESERVED_TENANT_SLUGS.has(slug) && TENANT_SLUG_REGEX.test(slug);
}

export function slugifyTenantName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function isValidOAuthRedirectUri(uri: string): boolean {
  const trimmed = uri.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  const protocol = parsed.protocol.toLowerCase();
  if (DANGEROUS_URI_SCHEMES.has(protocol)) return false;
  if (protocol === "https:" || protocol === "http:") {
    return Boolean(parsed.hostname);
  }
  if (!CUSTOM_SCHEME_REGEX.test(protocol)) return false;
  return Boolean(parsed.host || (parsed.pathname && parsed.pathname !== "/"));
}

export function getTierLabel(tierId: string): string {
  return (
    TENANT_TIER_OPTIONS.find((item) => item.id === tierId)?.name ?? tierId
  );
}

export function formatCurrency(amount: number, currency = "IDR"): string {
  const code = currency.toUpperCase() || "IDR";
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "IDR" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString("id-ID")}`;
  }
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") {
      qs.set(k, String(v));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// --- Local Hybrid Mode Mock Store (used only when VITE_API_URL is unset) ---
const MOCK_TENANT_KEY = "authcore-multitenant-mock-v1";

interface MockMultiTenantDb {
  tenants: TenantRecord[];
  billingRecords: BillingRecord[];
  oauthClients: PortalOAuthClientRecord[];
}

function createInitialMockDb(): MockMultiTenantDb {
  const now = Date.now();
  const iso = (offsetDays: number) =>
    new Date(now + offsetDays * 86400000).toISOString();

  return {
    tenants: [
      {
        id: "ten_acme_01",
        name: "Acme Corporation",
        slug: "acme-corp",
        ownerUserId: "usr_01",
        tierId: "tier_business",
        status: "active",
        billingStatus: "active",
        configVersion: 3,
        createdAt: iso(-45),
        updatedAt: iso(-2),
      },
      {
        id: "ten_nusantara_02",
        name: "Nusantara Fintech",
        slug: "nusantara-fin",
        ownerUserId: "usr_01",
        tierId: "tier_free",
        status: "active",
        billingStatus: "trialing",
        configVersion: 1,
        createdAt: iso(-12),
        updatedAt: iso(-12),
      },
      {
        id: "ten_sandbox_03",
        name: "Sandbox Retail Labs",
        slug: "sandbox-retail",
        ownerUserId: "usr_02",
        tierId: "tier_enterprise",
        status: "suspended",
        billingStatus: "past_due",
        configVersion: 4,
        createdAt: iso(-60),
        updatedAt: iso(-1),
      },
    ],
    billingRecords: [
      {
        id: "bil_01",
        tenantId: "ten_acme_01",
        tierId: "tier_business",
        status: "paid",
        amount: 499000,
        currency: "IDR",
        periodStart: iso(-30),
        periodEnd: iso(0),
        note: "Langganan Business bulanan",
        recordedBy: "usr_01",
        createdAt: iso(-30),
      },
      {
        id: "bil_02",
        tenantId: "ten_sandbox_03",
        tierId: "tier_enterprise",
        status: "past_due",
        amount: 2500000,
        currency: "IDR",
        periodStart: iso(-35),
        periodEnd: iso(-5),
        note: "Invoice enterprise menunggu pelunasan",
        recordedBy: "usr_01",
        createdAt: iso(-35),
      },
    ],
    oauthClients: [
      {
        id: "oa_ten_01",
        tenantId: "ten_acme_01",
        clientId: "acme_web_a1b2c3d4",
        name: "Acme Web Portal",
        type: "oidc-confidential",
        redirectUris: ["https://acme.example.com/callback"],
        scopes: ["openid", "profile", "email"],
        pkceRequired: true,
        active: true,
        createdAt: iso(-20),
      },
    ],
  };
}

function readMockTenantDb(): MockMultiTenantDb {
  if (typeof window === "undefined") return createInitialMockDb();
  try {
    const raw = window.localStorage.getItem(MOCK_TENANT_KEY);
    if (!raw) {
      const seed = createInitialMockDb();
      window.localStorage.setItem(MOCK_TENANT_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as MockMultiTenantDb;
  } catch {
    return createInitialMockDb();
  }
}

function writeMockTenantDb(db: MockMultiTenantDb): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOCK_TENANT_KEY, JSON.stringify(db));
  } catch {
    // ignore storage errors
  }
}

function paginateMock<T>(
  list: T[],
  page = 0,
  pageSize = 10,
): PaginatedResult<T> {
  const safePage = Math.max(0, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const start = safePage * safeSize;
  return {
    items: list.slice(start, start + safeSize),
    total: list.length,
    page: safePage,
    pageSize: safeSize,
  };
}

const RECORD_STATUS_TO_TENANT_STATUS: Record<
  BillingRecordStatus,
  TenantBillingStatus | undefined
> = {
  paid: "active",
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  manual_invoice: "manual_invoice",
  void: undefined,
};

// ============================================================================
// Customer Portal API (/api/portal/tenants)
// ============================================================================

export async function listMyTenants(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus;
} = {}): Promise<PaginatedResult<TenantRecord>> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PaginatedResult<TenantRecord>>(
      `/api/portal/tenants${buildQuery({
        page: params.page ?? 0,
        pageSize: params.pageSize ?? 10,
        search: params.search,
        status: params.status,
      })}`,
    );
  }

  const db = readMockTenantDb();
  let list = [...db.tenants];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }
  if (params.status) {
    list = list.filter((t) => t.status === params.status);
  }
  return paginateMock(list, params.page, params.pageSize);
}

export async function getMyTenant(tenantId: string): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantRecord>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}`,
    );
  }

  const db = readMockTenantDb();
  const found = db.tenants.find((t) => t.id === tenantId);
  if (!found) throw new Error("Tenant tidak ditemukan.");
  return found;
}

export async function createMyTenant(input: {
  name: string;
  slug: string;
}): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantRecord>("/api/portal/tenants", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  const db = readMockTenantDb();
  const slug = input.slug.trim().toLowerCase();
  if (!isValidTenantSlug(slug)) {
    throw new Error(`Slug tenant '${slug}' tidak valid atau termasuk reserved slug.`);
  }
  if (db.tenants.some((t) => t.slug === slug)) {
    throw new Error(`Slug tenant '${slug}' sudah digunakan.`);
  }
  const now = new Date().toISOString();
  const created: TenantRecord = {
    id: `ten_${Date.now().toString(36)}`,
    name: input.name.trim(),
    slug,
    ownerUserId: "usr_01",
    tierId: FREE_TIER_ID,
    status: "active",
    billingStatus: "active",
    configVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  writeMockTenantDb({ ...db, tenants: [created, ...db.tenants] });
  return created;
}

export async function updateMyTenant(
  tenantId: string,
  input: { name: string },
): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantRecord>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: input.name }),
      },
    );
  }

  const db = readMockTenantDb();
  const idx = db.tenants.findIndex((t) => t.id === tenantId);
  if (idx === -1) throw new Error("Tenant tidak ditemukan.");
  const updated: TenantRecord = {
    ...db.tenants[idx],
    name: input.name.trim(),
    updatedAt: new Date().toISOString(),
  };
  const next = [...db.tenants];
  next[idx] = updated;
  writeMockTenantDb({ ...db, tenants: next });
  return updated;
}

export async function listTenantOAuthClients(
  tenantId: string,
  params: { page?: number; pageSize?: number; search?: string } = {},
): Promise<PaginatedResult<PortalOAuthClientRecord>> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PaginatedResult<PortalOAuthClientRecord>>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/oauth-clients${buildQuery(
        {
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 10,
          search: params.search,
        },
      )}`,
    );
  }

  const db = readMockTenantDb();
  let list = db.oauthClients.filter((c) => c.tenantId === tenantId);
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q),
    );
  }
  return paginateMock(list, params.page, params.pageSize);
}

export async function createTenantOAuthClient(
  tenantId: string,
  input: {
    name: string;
    type: PortalOAuthClientType;
    redirectUris: string[];
    scopes: string[];
    pkceRequired: boolean;
  },
): Promise<PortalOAuthClientRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PortalOAuthClientRecord>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/oauth-clients`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  }

  const db = readMockTenantDb();
  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (!tenant) throw new Error("Tenant tidak ditemukan.");
  const existingCount = db.oauthClients.filter(
    (c) => c.tenantId === tenantId,
  ).length;
  if (
    tenant.tierId === FREE_TIER_ID &&
    existingCount >= FREE_TIER_MAX_OAUTH_CLIENTS
  ) {
    throw new Error(
      "Tier Free hanya mengizinkan maksimal 1 OAuth client per tenant.",
    );
  }

  const slugPrefix = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const plainClientSecret =
    input.type === "oidc-public"
      ? undefined
      : `ocs_${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 14)}`;

  const created: PortalOAuthClientRecord = {
    id: `oa_${Date.now().toString(36)}`,
    tenantId,
    clientId: `${slugPrefix || "client"}_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim(),
    type: input.type,
    redirectUris: input.redirectUris,
    scopes: input.scopes,
    pkceRequired: input.pkceRequired,
    active: true,
    createdAt: new Date().toISOString(),
  };

  writeMockTenantDb({
    ...db,
    oauthClients: [created, ...db.oauthClients],
  });

  return plainClientSecret ? { ...created, plainClientSecret } : created;
}

export async function deleteTenantOAuthClient(
  tenantId: string,
  clientId: string,
): Promise<void> {
  if (isExternalBackendConfigured()) {
    await apiRequest<void>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/oauth-clients/${encodeURIComponent(clientId)}`,
      { method: "DELETE" },
    );
    return;
  }

  const db = readMockTenantDb();
  writeMockTenantDb({
    ...db,
    oauthClients: db.oauthClients.filter(
      (c) => !(c.tenantId === tenantId && c.id === clientId),
    ),
  });
}

export async function getMyTenantBilling(
  tenantId: string,
  params: {
    page?: number;
    pageSize?: number;
    status?: BillingRecordStatus;
  } = {},
): Promise<PortalBillingSummary> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PortalBillingSummary>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/billing${buildQuery(
        {
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 10,
          status: params.status,
        },
      )}`,
    );
  }

  const db = readMockTenantDb();
  const tenant = db.tenants.find((t) => t.id === tenantId);
  if (!tenant) throw new Error("Tenant tidak ditemukan.");
  let records = db.billingRecords.filter((r) => r.tenantId === tenantId);
  if (params.status) {
    records = records.filter((r) => r.status === params.status);
  }
  const paged = paginateMock(records, params.page, params.pageSize);
  return {
    tenantId: tenant.id,
    tierId: tenant.tierId,
    billingStatus: tenant.billingStatus,
    ...paged,
  };
}

// ============================================================================
// Operator Tenants API (/api/admin/tenants)
// ============================================================================

export async function adminListTenants(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus;
  tierId?: string;
} = {}): Promise<PaginatedResult<TenantRecord>> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PaginatedResult<TenantRecord>>(
      `/api/admin/tenants${buildQuery({
        page: params.page ?? 0,
        pageSize: params.pageSize ?? 10,
        search: params.search,
        status: params.status,
        tierId: params.tierId,
      })}`,
    );
  }

  const db = readMockTenantDb();
  let list = [...db.tenants];
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }
  if (params.status) {
    list = list.filter((t) => t.status === params.status);
  }
  if (params.tierId) {
    list = list.filter((t) => t.tierId === params.tierId);
  }
  return paginateMock(list, params.page, params.pageSize);
}

export async function adminCreateTenant(input: {
  name: string;
  slug: string;
  ownerUserId: string;
  tierId?: string;
  billingStatus?: TenantBillingStatus;
}): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantRecord>("/api/admin/tenants", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  const db = readMockTenantDb();
  const slug = input.slug.trim().toLowerCase();
  if (!isValidTenantSlug(slug)) {
    throw new Error(`Slug tenant '${slug}' tidak valid.`);
  }
  if (db.tenants.some((t) => t.slug === slug)) {
    throw new Error(`Slug tenant '${slug}' sudah digunakan.`);
  }
  const now = new Date().toISOString();
  const created: TenantRecord = {
    id: `ten_${Date.now().toString(36)}`,
    name: input.name.trim(),
    slug,
    ownerUserId: input.ownerUserId.trim(),
    tierId: input.tierId || FREE_TIER_ID,
    status: "active",
    billingStatus: input.billingStatus ?? "active",
    configVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  writeMockTenantDb({ ...db, tenants: [created, ...db.tenants] });
  return created;
}

export async function adminUpdateTenantStatus(
  tenantId: string,
  status: TenantStatus,
): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    const action = status === "suspended" ? "suspend" : "activate";
    return apiRequest<TenantRecord>(
      `/api/admin/tenants/${encodeURIComponent(tenantId)}/${action}`,
      { method: "POST" },
    );
  }

  const db = readMockTenantDb();
  const idx = db.tenants.findIndex((t) => t.id === tenantId);
  if (idx === -1) throw new Error("Tenant tidak ditemukan.");
  const current = db.tenants[idx];
  const updated: TenantRecord = {
    ...current,
    status,
    configVersion:
      current.status !== status
        ? current.configVersion + 1
        : current.configVersion,
    updatedAt: new Date().toISOString(),
  };
  const next = [...db.tenants];
  next[idx] = updated;
  writeMockTenantDb({ ...db, tenants: next });
  return updated;
}

export async function adminUpdateTenantTier(
  tenantId: string,
  tierId: string,
): Promise<TenantRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantRecord>(
      `/api/admin/tenants/${encodeURIComponent(tenantId)}/tier`,
      {
        method: "PATCH",
        body: JSON.stringify({ tierId }),
      },
    );
  }

  const db = readMockTenantDb();
  const idx = db.tenants.findIndex((t) => t.id === tenantId);
  if (idx === -1) throw new Error("Tenant tidak ditemukan.");
  const current = db.tenants[idx];
  const updated: TenantRecord = {
    ...current,
    tierId,
    configVersion:
      current.tierId !== tierId
        ? current.configVersion + 1
        : current.configVersion,
    updatedAt: new Date().toISOString(),
  };
  const next = [...db.tenants];
  next[idx] = updated;
  writeMockTenantDb({ ...db, tenants: next });
  return updated;
}

// ============================================================================
// Operator Billing API (/api/admin/billing)
// ============================================================================

export async function adminListBillingRecords(params: {
  page?: number;
  pageSize?: number;
  tenantId?: string;
  tierId?: string;
  status?: BillingRecordStatus;
} = {}): Promise<PaginatedResult<BillingRecord>> {
  if (isExternalBackendConfigured()) {
    return apiRequest<PaginatedResult<BillingRecord>>(
      `/api/admin/billing${buildQuery({
        page: params.page ?? 0,
        pageSize: params.pageSize ?? 10,
        tenantId: params.tenantId,
        tierId: params.tierId,
        status: params.status,
      })}`,
    );
  }

  const db = readMockTenantDb();
  let list = [...db.billingRecords];
  if (params.tenantId) {
    list = list.filter((r) => r.tenantId === params.tenantId);
  }
  if (params.tierId) {
    list = list.filter((r) => r.tierId === params.tierId);
  }
  if (params.status) {
    list = list.filter((r) => r.status === params.status);
  }
  return paginateMock(list, params.page, params.pageSize);
}

export async function adminCreateBillingRecord(input: {
  tenantId: string;
  tierId: string;
  status: BillingRecordStatus;
  amount: number;
  currency?: string;
  periodStart: string;
  periodEnd: string;
  note?: string;
  tenantBillingStatus?: TenantBillingStatus;
}): Promise<BillingRecord> {
  if (isExternalBackendConfigured()) {
    return apiRequest<BillingRecord>("/api/admin/billing", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  const db = readMockTenantDb();
  const tenantIdx = db.tenants.findIndex((t) => t.id === input.tenantId);
  if (tenantIdx === -1) throw new Error("Tenant tidak ditemukan.");

  const created: BillingRecord = {
    id: `bil_${Date.now().toString(36)}`,
    tenantId: input.tenantId,
    tierId: input.tierId,
    status: input.status,
    amount: input.amount,
    currency: (input.currency?.trim() || "IDR").toUpperCase(),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    note: input.note?.trim() || null,
    recordedBy: "usr_01",
    createdAt: new Date().toISOString(),
  };

  const nextBillingStatus =
    input.tenantBillingStatus ?? RECORD_STATUS_TO_TENANT_STATUS[input.status];
  const nextTenants = [...db.tenants];
  if (nextBillingStatus) {
    nextTenants[tenantIdx] = {
      ...nextTenants[tenantIdx],
      billingStatus: nextBillingStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  writeMockTenantDb({
    ...db,
    tenants: nextTenants,
    billingRecords: [created, ...db.billingRecords],
  });
  return created;
}
