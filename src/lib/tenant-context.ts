import { getApiBaseUrl } from "@/api/client";
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

export interface TenantCapabilityEntry {
  available: boolean;
  reason?: string;
  packageName: string;
}

export interface TenantAuthConfigResponse {
  features: FeatureConfigMap;
  capabilities: Partial<Record<BetterAuthFeatureId, TenantCapabilityEntry>>;
}

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

  const platformHost = (
    import.meta.env.VITE_PLATFORM_HOST as string | undefined
  )
    ?.trim()
    .toLowerCase();
  if (platformHost && hostname === platformHost) {
    return { mode: "platform", tenantSlug: null };
  }

  const baseDomain = (
    import.meta.env.VITE_TENANT_BASE_DOMAIN as string | undefined
  )
    ?.trim()
    .toLowerCase()
    .replace(/^\./, "");

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

function resolveOriginBase(): string {
  const apiBase = getApiBaseUrl();
  if (apiBase) return apiBase;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:2000";
}

export function getTenantAuthConfigUrl(context: TenantContextInfo): string {
  const base = resolveOriginBase();
  if (context.mode === "path" && context.tenantSlug) {
    return `${base}/t/${encodeURIComponent(context.tenantSlug)}/api/auth-config`;
  }
  return `${base}/api/auth-config`;
}

export function getTenantSocialBridgeStartUrl(
  context: TenantContextInfo,
  provider: string,
  returnTo?: string,
): string {
  const base = resolveOriginBase();
  const prefix =
    context.mode === "path" && context.tenantSlug
      ? `${base}/t/${encodeURIComponent(context.tenantSlug)}`
      : base;
  const url = new URL(
    `${prefix}/api/social-bridge/start/${encodeURIComponent(provider)}`,
  );
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
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
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore invalid json
    }
    throw new Error(message);
  }

  const raw = (await response.json()) as {
    features?: Partial<FeatureConfigMap>;
    capabilities?: Partial<Record<BetterAuthFeatureId, TenantCapabilityEntry>>;
  };

  const defaults = buildDefaultFeatureConfigMap();
  const mergedFeatures: FeatureConfigMap = { ...defaults };

  if (raw.features) {
    for (const key of Object.keys(defaults) as BetterAuthFeatureId[]) {
      const remote = raw.features[key];
      if (remote && typeof remote.enabled === "boolean") {
        mergedFeatures[key] = {
          enabled: remote.enabled,
          settings: {
            ...defaults[key].settings,
            ...(remote.settings ?? {}),
          },
        };
      }
    }
  }

  return {
    features: mergedFeatures,
    capabilities: raw.capabilities ?? {},
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
