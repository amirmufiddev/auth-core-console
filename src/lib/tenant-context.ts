import { getApiBaseUrl, unwrapApiEnvelope } from "@/api/client";
import {
  type BetterAuthFeatureId,
  type FeatureConfigMap,
  buildDefaultFeatureConfigMap,
} from "@/config/better-auth.config";

export type TenantAccessMode = "path" | "subdomain" | "platform";

export interface TenantContextInfo {
  mode: TenantAccessMode;
  tenantSlug: string | null;
}

export interface TenantOriginTarget {
  origin: string;
  pathPrefix: string;
}

export interface TenantCapabilityEntry {
  available: boolean;
  reason?: string;
  packageName: string;
}

export interface TenantAuthConfigResponse {
  features: FeatureConfigMap;
  capabilities: Partial<Record<BetterAuthFeatureId, TenantCapabilityEntry>>;
}

export const SUPPORTED_TENANT_SOCIAL_BRIDGE_PROVIDERS = new Set([
  "google",
  "github",
]);

const RESERVED_PLATFORM_SUBDOMAINS = new Set([
  "auth",
  "console",
  "admin",
  "api",
  "www",
  "app",
]);

function isIpAddress(hostname: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  if (hostname.includes(":")) return true;
  return false;
}

function getPlatformHostEnv(): string {
  return (
    (import.meta.env.VITE_PLATFORM_HOST as string | undefined)
      ?.trim()
      .toLowerCase() ?? ""
  );
}

function getTenantBaseDomainEnv(): string {
  return (
    (import.meta.env.VITE_TENANT_BASE_DOMAIN as string | undefined)
      ?.trim()
      .toLowerCase()
      .replace(/^\./, "") ?? ""
  );
}

export function resolveTenantFromHostname(
  hostnameInput?: string,
): TenantContextInfo {
  const rawHost =
    hostnameInput ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  const hostname = rawHost.trim().toLowerCase();

  if (!hostname || hostname === "localhost" || isIpAddress(hostname)) {
    return { mode: "platform", tenantSlug: null };
  }

  const platformHost = getPlatformHostEnv();
  if (platformHost && hostname === platformHost) {
    return { mode: "platform", tenantSlug: null };
  }

  const baseDomain = getTenantBaseDomainEnv();

  if (baseDomain) {
    if (hostname === baseDomain) {
      return { mode: "platform", tenantSlug: null };
    }
    const suffix = `.${baseDomain}`;
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      if (sub && !sub.includes(".") && !RESERVED_PLATFORM_SUBDOMAINS.has(sub)) {
        return { mode: "subdomain", tenantSlug: sub };
      }
    }
    return { mode: "platform", tenantSlug: null };
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (candidate && !RESERVED_PLATFORM_SUBDOMAINS.has(candidate)) {
      return { mode: "subdomain", tenantSlug: candidate };
    }
  }

  return { mode: "platform", tenantSlug: null };
}

export function resolveTenantContext(
  routeTenantSlug?: string | null,
): TenantContextInfo {
  const trimmed = routeTenantSlug?.trim();
  if (trimmed) {
    return { mode: "path", tenantSlug: trimmed };
  }
  return resolveTenantFromHostname();
}

function rewriteSubdomainApiHost(
  apiBase: string,
  tenantSlug: string,
): TenantOriginTarget {
  const slug = tenantSlug.trim().toLowerCase();
  const pathFallback: TenantOriginTarget = {
    origin: apiBase,
    pathPrefix: `/t/${encodeURIComponent(slug)}`,
  };

  let apiUrl: URL;
  try {
    apiUrl = new URL(apiBase);
  } catch {
    return pathFallback;
  }

  const apiHost = apiUrl.hostname.toLowerCase();
  if (!apiHost || isIpAddress(apiHost)) {
    return pathFallback;
  }

  const platformHost = getPlatformHostEnv();
  const baseDomainEnv = getTenantBaseDomainEnv();
  const windowHost =
    typeof window !== "undefined"
      ? window.location.hostname.trim().toLowerCase()
      : "";

  const isRewriteableLabel = (sub: string) =>
    Boolean(sub) &&
    !sub.includes(".") &&
    (sub === slug ||
      RESERVED_PLATFORM_SUBDOMAINS.has(sub) ||
      (platformHost !== "" && apiHost === platformHost));

  if (apiHost === "localhost" || apiHost.endsWith(".localhost")) {
    if (apiHost === "localhost") {
      apiUrl.hostname = `${slug}.localhost`;
      return { origin: apiUrl.origin, pathPrefix: "" };
    }
    const sub = apiHost.slice(0, -".localhost".length);
    if (isRewriteableLabel(sub)) {
      apiUrl.hostname = `${slug}.localhost`;
      return { origin: apiUrl.origin, pathPrefix: "" };
    }
    return pathFallback;
  }

  const inferredBaseDomain =
    baseDomainEnv ||
    (windowHost.startsWith(`${slug}.`)
      ? windowHost.slice(slug.length + 1)
      : "");

  if (inferredBaseDomain) {
    if (apiHost === inferredBaseDomain) {
      apiUrl.hostname = `${slug}.${inferredBaseDomain}`;
      return { origin: apiUrl.origin, pathPrefix: "" };
    }
    const suffix = `.${inferredBaseDomain}`;
    if (apiHost.endsWith(suffix)) {
      const sub = apiHost.slice(0, -suffix.length);
      if (isRewriteableLabel(sub)) {
        apiUrl.hostname = `${slug}.${inferredBaseDomain}`;
        return { origin: apiUrl.origin, pathPrefix: "" };
      }
    }
    return pathFallback;
  }

  const parts = apiHost.split(".").filter(Boolean);
  if (parts.length === 2) {
    apiUrl.hostname = `${slug}.${apiHost}`;
    return { origin: apiUrl.origin, pathPrefix: "" };
  }
  if (parts.length >= 3 && isRewriteableLabel(parts[0])) {
    apiUrl.hostname = `${slug}.${parts.slice(1).join(".")}`;
    return { origin: apiUrl.origin, pathPrefix: "" };
  }

  return pathFallback;
}

export function resolveTenantOriginTarget(
  context: TenantContextInfo,
): TenantOriginTarget {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:2000";
    const pathPrefix =
      context.mode === "path" && context.tenantSlug
        ? `/t/${encodeURIComponent(context.tenantSlug)}`
        : "";
    return { origin, pathPrefix };
  }

  if (context.mode === "subdomain" && context.tenantSlug) {
    return rewriteSubdomainApiHost(apiBase, context.tenantSlug);
  }

  if (context.mode === "path" && context.tenantSlug) {
    return {
      origin: apiBase,
      pathPrefix: `/t/${encodeURIComponent(context.tenantSlug)}`,
    };
  }

  return { origin: apiBase, pathPrefix: "" };
}

export function getTenantAuthConfigUrl(context: TenantContextInfo): string {
  const { origin, pathPrefix } = resolveTenantOriginTarget(context);
  return `${origin}${pathPrefix}/api/auth-config`;
}

function hasControlOrBackslash(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c) {
      return true;
    }
  }
  return /(?:%0[0-9a-f]|%1[0-9a-f]|%7f|%5c)/i.test(value);
}

export function sanitizeRelativeRedirect(value?: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || hasControlOrBackslash(trimmed)) {
    return "/";
  }
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  try {
    const parsed = new URL(trimmed, "https://safe.local");
    if (parsed.origin !== "https://safe.local") {
      return "/";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function sanitizeOAuthRedirectUrl(value?: string): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || hasControlOrBackslash(trimmed)) {
    return null;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return sanitizeRelativeRedirect(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getTenantSocialBridgeStartUrl(
  context: TenantContextInfo,
  provider: string,
  returnTo?: string,
): string {
  const { origin, pathPrefix } = resolveTenantOriginTarget(context);
  const url = new URL(
    `${origin}${pathPrefix}/api/social-bridge/start/${encodeURIComponent(provider)}`,
  );
  if (returnTo) {
    url.searchParams.set("returnTo", sanitizeRelativeRedirect(returnTo));
  }
  return url.toString();
}

export async function fetchTenantAuthConfig(
  context: TenantContextInfo,
): Promise<TenantAuthConfigResponse> {
  const url = getTenantAuthConfigUrl(context);
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `Gagal memuat konfigurasi tenant (${response.status})`;
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: { message?: string };
      };
      if (body?.message) message = body.message;
      else if (body?.error?.message) message = body.error.message;
    } catch {
      // ignore invalid json
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as unknown;
  const unwrapped = unwrapApiEnvelope<{
    features?: Partial<FeatureConfigMap>;
    capabilities?: Partial<Record<BetterAuthFeatureId, TenantCapabilityEntry>>;
  }>(payload);
  const raw =
    unwrapped &&
    typeof unwrapped === "object" &&
    !("features" in unwrapped) &&
    "data" in unwrapped &&
    (unwrapped as { data?: unknown }).data &&
    typeof (unwrapped as { data?: unknown }).data === "object"
      ? (unwrapped as { data: typeof unwrapped }).data
      : unwrapped;

  const defaults = buildDefaultFeatureConfigMap();
  const mergedFeatures: FeatureConfigMap = { ...defaults };

  if (raw?.features) {
    for (const key of Object.keys(defaults) as BetterAuthFeatureId[]) {
      const remote = raw.features[key];
      if (remote && typeof remote.enabled === "boolean") {
        mergedFeatures[key] = {
          enabled: remote.enabled,
          settings: {
            ...defaults[key].settings,
            ...(remote.settings ?? {}),
          },
          ...(remote.secretsConfigured
            ? { secretsConfigured: { ...remote.secretsConfigured } }
            : defaults[key].secretsConfigured
              ? { secretsConfigured: { ...defaults[key].secretsConfigured } }
              : {}),
        };
      }
    }
  }

  return {
    features: mergedFeatures,
    capabilities: raw?.capabilities ?? {},
  };
}

export function isTenantFeatureActive(
  config: TenantAuthConfigResponse | null,
  featureId: BetterAuthFeatureId,
): boolean {
  if (!config) return false;
  const enabled = Boolean(config.features[featureId]?.enabled);
  const cap = config.capabilities[featureId];
  if (cap && cap.available === false) return false;
  return enabled;
}
