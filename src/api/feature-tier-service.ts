import { apiRequest, isExternalBackendConfigured } from "@/api/client";
import { TENANT_TIER_OPTIONS } from "@/api/tenant-service";
import { BETTER_AUTH_FEATURES } from "@/config/better-auth.config";

export type AuthFeatureStatus = "active" | "disabled" | "coming_soon";

export interface AuthFeatureAvailableSetting {
  key: string;
  label: string;
  type: string;
  options?: Array<{ label: string; value: string | number | boolean } | string>;
  defaultValue?: string | number | boolean;
  required?: boolean;
}

export interface AdminFeatureRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  packageName: string;
  status: AuthFeatureStatus;
  dependencies: string[];
  availableSetting: AuthFeatureAvailableSetting[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminTierRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
  featureIds: string[];
  featureCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureConfigView {
  featureId: string;
  featureCode: string;
  name: string;
  category: string;
  status: AuthFeatureStatus;
  allowedInTier: boolean;
  enabled: boolean;
  configuredEnabled: boolean;
  settings: Record<string, string | number | boolean>;
  availableSetting: AuthFeatureAvailableSetting[];
  secretsConfigured: Record<string, boolean>;
}

export interface UpdateTenantFeatureConfigPayload {
  featureCode: string;
  enabled: boolean;
  settings?: Record<string, string | number | boolean>;
  secrets?: Record<string, string | null | undefined>;
  clearSecretKeys?: string[];
}

// Local fallback state when VITE_API_URL is not configured
const localFeatures: AdminFeatureRecord[] = BETTER_AUTH_FEATURES.map((f) => ({
  id: f.id,
  code: f.id,
  name: f.name,
  description: f.description,
  category: f.category,
  packageName: f.packageName,
  status: "active",
  dependencies: f.dependencies ?? [],
  availableSetting: f.settingsSchema.map((s) => ({
    key: s.key,
    label: s.label,
    type: s.type,
    options: s.options,
    defaultValue: f.defaultSettings[s.key],
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const localTiers: AdminTierRecord[] = TENANT_TIER_OPTIONS.map((t, idx) => {
  const defaultCodes =
    t.id === "tier_free"
      ? ["emailAndPassword", "emailVerification", "sessionManagement", "rateLimit"]
      : t.id === "tier_basic"
        ? [
            "emailAndPassword",
            "emailVerification",
            "sessionManagement",
            "rateLimit",
            "twoFactor",
            "magicLink",
            "emailOTP",
            "apiKey",
            "socialGoogle",
            "socialGithub",
          ]
        : BETTER_AUTH_FEATURES.map((f) => f.id);

  return {
    id: t.id,
    code: t.id.replace(/^tier_/, ""),
    name: t.name,
    description: t.description,
    sortOrder: idx,
    isDefault: t.id === "tier_free",
    featureIds: [...defaultCodes],
    featureCodes: [...defaultCodes],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

const localTenantConfigs = new Map<string, Map<string, TenantFeatureConfigView>>();

export async function adminListFeatures(): Promise<AdminFeatureRecord[]> {
  if (isExternalBackendConfigured()) {
    return apiRequest<AdminFeatureRecord[]>("/api/admin/features");
  }
  return [...localFeatures];
}

export async function adminUpdateFeatureStatus(
  featureId: string,
  status: AuthFeatureStatus,
): Promise<{ feature: AdminFeatureRecord; catalogVersion: number }> {
  if (isExternalBackendConfigured()) {
    return apiRequest<{ feature: AdminFeatureRecord; catalogVersion: number }>(
      `/api/admin/features/${encodeURIComponent(featureId)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  }
  const target = localFeatures.find(
    (f) => f.id === featureId || f.code === featureId,
  );
  if (!target) {
    throw new Error(`Feature '${featureId}' tidak ditemukan.`);
  }
  target.status = status;
  target.updatedAt = new Date().toISOString();
  return { feature: { ...target }, catalogVersion: Date.now() };
}

export async function adminListTiers(): Promise<AdminTierRecord[]> {
  if (isExternalBackendConfigured()) {
    return apiRequest<AdminTierRecord[]>("/api/admin/tiers");
  }
  return localTiers.map((t) => ({
    ...t,
    featureIds: [...t.featureIds],
    featureCodes: [...t.featureCodes],
  }));
}

export async function adminUpdateTierFeatures(
  tierId: string,
  features: string[],
): Promise<{ tierId: string; featureIds: string[]; catalogVersion: number }> {
  if (isExternalBackendConfigured()) {
    return apiRequest<{
      tierId: string;
      featureIds: string[];
      catalogVersion: number;
    }>(`/api/admin/tiers/${encodeURIComponent(tierId)}/features`, {
      method: "PUT",
      body: JSON.stringify({ features }),
    });
  }
  const tier = localTiers.find((t) => t.id === tierId);
  if (!tier) {
    throw new Error(`Tier '${tierId}' tidak ditemukan.`);
  }
  tier.featureIds = [...features];
  tier.featureCodes = [...features];
  tier.updatedAt = new Date().toISOString();
  return { tierId, featureIds: [...features], catalogVersion: Date.now() };
}

export async function getPortalTenantFeatures(
  tenantId: string,
): Promise<TenantFeatureConfigView[]> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantFeatureConfigView[]>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/features`,
    );
  }
  let map = localTenantConfigs.get(tenantId);
  if (!map) {
    map = new Map();
    const defaultTier = localTiers[0];
    for (const f of localFeatures) {
      const allowed = defaultTier.featureIds.includes(f.id);
      const secretsConfigured: Record<string, boolean> = {};
      const settings: Record<string, string | number | boolean> = {};
      for (const s of f.availableSetting) {
        if (s.type === "secret") {
          secretsConfigured[s.key] = false;
        } else if (s.defaultValue !== undefined) {
          settings[s.key] = s.defaultValue;
        }
      }
      map.set(f.code, {
        featureId: f.id,
        featureCode: f.code,
        name: f.name,
        category: f.category,
        status: f.status,
        allowedInTier: allowed,
        enabled: false,
        configuredEnabled: false,
        settings,
        availableSetting: f.availableSetting,
        secretsConfigured,
      });
    }
    localTenantConfigs.set(tenantId, map);
  }
  return Array.from(map.values());
}

export async function updatePortalTenantFeature(
  tenantId: string,
  payload: UpdateTenantFeatureConfigPayload,
): Promise<TenantFeatureConfigView> {
  if (isExternalBackendConfigured()) {
    return apiRequest<TenantFeatureConfigView>(
      `/api/portal/tenants/${encodeURIComponent(tenantId)}/features`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  }
  const list = await getPortalTenantFeatures(tenantId);
  const existing = list.find((item) => item.featureCode === payload.featureCode);
  if (!existing) {
    throw new Error(`Feature '${payload.featureCode}' tidak ditemukan.`);
  }
  const nextSecretsConfigured = { ...existing.secretsConfigured };
  if (payload.secrets) {
    for (const [k, v] of Object.entries(payload.secrets)) {
      if (typeof v === "string" && v.length > 0) {
        nextSecretsConfigured[k] = true;
      }
    }
  }
  if (payload.clearSecretKeys) {
    for (const k of payload.clearSecretKeys) {
      nextSecretsConfigured[k] = false;
    }
  }
  const updated: TenantFeatureConfigView = {
    ...existing,
    enabled: existing.allowedInTier && existing.status === "active" ? payload.enabled : false,
    configuredEnabled: payload.enabled,
    settings: {
      ...existing.settings,
      ...(payload.settings ?? {}),
    },
    secretsConfigured: nextSecretsConfigured,
  };
  localTenantConfigs.get(tenantId)?.set(payload.featureCode, updated);
  return updated;
}
