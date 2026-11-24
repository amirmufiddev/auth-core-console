import { create } from "zustand";
import { apiRequest, isExternalBackendConfigured } from "@/api/client";
import {
  BETTER_AUTH_FEATURE_MAP,
  type BetterAuthFeatureId,
  type ConfigPresetId,
  type FeatureConfigMap,
  buildDefaultFeatureConfigMap,
  buildPresetFeatureConfigMap,
} from "@/config/better-auth.config";

const CONFIG_STORAGE_KEY = "authcore-feature-config";
const SECRET_KEY_PATTERN = /secret|token|password|apikey|private/i;

export interface AuthConfigFeatureUpdateInput {
  enabled?: boolean;
  settings?: Record<string, string | number | boolean>;
  secrets?: Record<string, string | null | undefined>;
  clearSecretKeys?: string[];
}

function getSecretKeysForFeature(id: BetterAuthFeatureId): Set<string> {
  const def = BETTER_AUTH_FEATURE_MAP[id];
  return new Set(
    (def?.settingsSchema ?? [])
      .filter((s) => s.type === "secret")
      .map((s) => s.key),
  );
}

function getNonSecretKeysForFeature(id: BetterAuthFeatureId): Set<string> {
  const def = BETTER_AUTH_FEATURE_MAP[id];
  return new Set(
    (def?.settingsSchema ?? [])
      .filter((s) => s.type !== "secret")
      .map((s) => s.key),
  );
}

function stripSecretSettings(
  id: BetterAuthFeatureId,
  settings?: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const secretKeys = getSecretKeysForFeature(id);
  const nonSecretKeys = getNonSecretKeysForFeature(id);
  const clean: Record<string, string | number | boolean> = {};
  if (!settings || typeof settings !== "object") return clean;
  for (const [key, value] of Object.entries(settings)) {
    if (
      secretKeys.has(key) ||
      (!nonSecretKeys.has(key) && SECRET_KEY_PATTERN.test(key))
    ) {
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    }
  }
  return clean;
}

function sanitizeConfigMapForStorage(
  features: FeatureConfigMap,
): FeatureConfigMap {
  const defaults = buildDefaultFeatureConfigMap();
  const clean = {} as FeatureConfigMap;
  for (const key of Object.keys(defaults) as BetterAuthFeatureId[]) {
    const entry = features[key] ?? defaults[key];
    const defaultSecrets = defaults[key].secretsConfigured;
    clean[key] = {
      enabled: Boolean(entry.enabled),
      settings: {
        ...defaults[key].settings,
        ...stripSecretSettings(key, entry.settings),
      },
      ...(defaultSecrets || entry.secretsConfigured
        ? {
            secretsConfigured: {
              ...(defaultSecrets ?? {}),
              ...(entry.secretsConfigured ?? {}),
            },
          }
        : {}),
    };
  }
  return clean;
}

export class FeatureDisabledError extends Error {
  readonly featureId: BetterAuthFeatureId;
  readonly code = "FEATURE_DISABLED";

  constructor(featureId: BetterAuthFeatureId) {
    const def = BETTER_AUTH_FEATURE_MAP[featureId];
    super(
      `Fitur "${def?.name ?? featureId}" sedang dinonaktifkan di Auth Core.`,
    );
    this.name = "FeatureDisabledError";
    this.featureId = featureId;
  }
}

function loadStoredConfig(): FeatureConfigMap {
  const defaults = buildDefaultFeatureConfigMap();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<FeatureConfigMap>;
    const merged = { ...defaults };
    for (const key of Object.keys(defaults) as BetterAuthFeatureId[]) {
      const saved = parsed[key];
      if (saved && typeof saved.enabled === "boolean") {
        const defaultSecrets = defaults[key].secretsConfigured;
        merged[key] = {
          enabled: saved.enabled,
          settings: {
            ...defaults[key].settings,
            ...stripSecretSettings(key, saved.settings),
          },
          ...(defaultSecrets || saved.secretsConfigured
            ? {
                secretsConfigured: {
                  ...(defaultSecrets ?? {}),
                  ...(saved.secretsConfigured ?? {}),
                },
              }
            : {}),
        };
      }
    }
    return merged;
  } catch {
    return defaults;
  }
}

function persistConfig(features: FeatureConfigMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify(sanitizeConfigMapForStorage(features)),
    );
  } catch {
    // ignore quota errors
  }
}

async function syncRemoteConfig(
  features: FeatureConfigMap,
  secretPatches?: Partial<
    Record<
      BetterAuthFeatureId,
      {
        secrets?: Record<string, string | null | undefined>;
        clearSecretKeys?: string[];
      }
    >
  >,
): Promise<Partial<FeatureConfigMap> | null> {
  if (!isExternalBackendConfigured()) return null;
  try {
    const payloadFeatures: Record<string, AuthConfigFeatureUpdateInput> = {};
    for (const key of Object.keys(features) as BetterAuthFeatureId[]) {
      const entry = features[key];
      const patch = secretPatches?.[key];
      payloadFeatures[key] = {
        enabled: entry.enabled,
        settings: stripSecretSettings(key, entry.settings),
        ...(patch?.secrets && Object.keys(patch.secrets).length > 0
          ? { secrets: patch.secrets }
          : {}),
        ...(patch?.clearSecretKeys && patch.clearSecretKeys.length > 0
          ? { clearSecretKeys: patch.clearSecretKeys }
          : {}),
      };
    }

    const res = await apiRequest<{ features?: Partial<FeatureConfigMap> }>(
      "/api/auth-config",
      {
        method: "PUT",
        body: JSON.stringify({ features: payloadFeatures }),
      },
    );
    return res?.features ?? {};
  } catch {
    return null;
  }
}

interface AuthConfigStoreState {
  features: FeatureConfigMap;
  lastSyncedAt: string | null;
  syncStatus: "local" | "synced" | "syncing";
  isFeatureEnabled: (id: BetterAuthFeatureId) => boolean;
  toggleFeature: (
    id: BetterAuthFeatureId,
    enabled: boolean,
  ) => { ok: boolean; error?: string; autoEnabled?: BetterAuthFeatureId[] };
  updateFeatureSettings: (
    id: BetterAuthFeatureId,
    settings: Record<string, string | number | boolean>,
    options?: {
      secrets?: Record<string, string>;
      clearSecretKeys?: string[];
    },
  ) => void;
  applyPreset: (preset: ConfigPresetId) => void;
  resetDefaults: () => void;
  hydrateFromRemote: () => Promise<void>;
}

function mergeRemoteFeaturesInto(
  base: FeatureConfigMap,
  remoteFeatures: Partial<FeatureConfigMap>,
): FeatureConfigMap {
  const merged = { ...base };
  for (const key of Object.keys(base) as BetterAuthFeatureId[]) {
    const remote = remoteFeatures[key];
    if (remote && typeof remote.enabled === "boolean") {
      merged[key] = {
        enabled: remote.enabled,
        settings: {
          ...base[key].settings,
          ...stripSecretSettings(key, remote.settings),
        },
        ...(base[key].secretsConfigured || remote.secretsConfigured
          ? {
              secretsConfigured: {
                ...(base[key].secretsConfigured ?? {}),
                ...(remote.secretsConfigured ?? {}),
              },
            }
          : {}),
      };
    }
  }
  return merged;
}

export const useAuthConfigStore = create<AuthConfigStoreState>((set, get) => ({
  features: loadStoredConfig(),
  lastSyncedAt: null,
  syncStatus: "local",

  isFeatureEnabled: (id) => Boolean(get().features[id]?.enabled),

  toggleFeature: (id, enabled) => {
    const current = get().features;
    const def = BETTER_AUTH_FEATURE_MAP[id];
    const next: FeatureConfigMap = { ...current };
    const autoEnabled: BetterAuthFeatureId[] = [];

    if (enabled && def?.dependencies?.length) {
      for (const dep of def.dependencies) {
        if (!next[dep]?.enabled) {
          next[dep] = {
            ...next[dep],
            enabled: true,
          };
          autoEnabled.push(dep);
        }
      }
    }

    if (!enabled) {
      const dependents = Object.values(BETTER_AUTH_FEATURE_MAP).filter(
        (item) =>
          item.dependencies?.includes(id) &&
          next[item.id]?.enabled &&
          item.id !== id,
      );
      if (dependents.length > 0) {
        return {
          ok: false,
          error: `Nonaktifkan terlebih dahulu fitur bergantung: ${dependents
            .map((d) => d.name)
            .join(", ")}`,
        };
      }
    }

    next[id] = {
      ...next[id],
      enabled,
    };

    persistConfig(next);
    set({
      features: next,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: isExternalBackendConfigured() ? "syncing" : "local",
    });

    if (isExternalBackendConfigured()) {
      void syncRemoteConfig(next).then((remoteFeatures) => {
        if (remoteFeatures) {
          const syncedMap = mergeRemoteFeaturesInto(get().features, remoteFeatures);
          persistConfig(syncedMap);
          set({ features: syncedMap, syncStatus: "synced" });
        } else {
          set({ syncStatus: "local" });
        }
      });
    }

    return { ok: true, autoEnabled };
  },

  updateFeatureSettings: (id, settings, options) => {
    const current = get().features;
    const cleanIncomingSettings = stripSecretSettings(id, settings);
    const nextSecretsConfigured: Record<string, boolean> = {
      ...(current[id]?.secretsConfigured ?? {}),
    };
    if (options?.secrets) {
      for (const [k, v] of Object.entries(options.secrets)) {
        if (typeof v === "string" && v.trim().length > 0) {
          nextSecretsConfigured[k] = true;
        }
      }
    }
    if (options?.clearSecretKeys) {
      for (const k of options.clearSecretKeys) {
        nextSecretsConfigured[k] = false;
      }
    }

    const next: FeatureConfigMap = {
      ...current,
      [id]: {
        ...current[id],
        settings: {
          ...stripSecretSettings(id, current[id].settings),
          ...cleanIncomingSettings,
        },
        ...(Object.keys(nextSecretsConfigured).length > 0
          ? { secretsConfigured: nextSecretsConfigured }
          : {}),
      },
    };
    persistConfig(next);
    set({
      features: next,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: isExternalBackendConfigured() ? "syncing" : "local",
    });
    if (isExternalBackendConfigured()) {
      void syncRemoteConfig(next, {
        [id]: {
          secrets: options?.secrets,
          clearSecretKeys: options?.clearSecretKeys,
        },
      }).then((remoteFeatures) => {
        if (remoteFeatures) {
          const syncedMap = mergeRemoteFeaturesInto(get().features, remoteFeatures);
          persistConfig(syncedMap);
          set({ features: syncedMap, syncStatus: "synced" });
        } else {
          set({ syncStatus: "local" });
        }
      });
    }
  },

  applyPreset: (preset) => {
    const next = buildPresetFeatureConfigMap(preset, get().features);
    persistConfig(next);
    set({
      features: next,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: isExternalBackendConfigured() ? "syncing" : "local",
    });
    if (isExternalBackendConfigured()) {
      void syncRemoteConfig(next).then((remoteFeatures) => {
        if (remoteFeatures) {
          const syncedMap = mergeRemoteFeaturesInto(get().features, remoteFeatures);
          persistConfig(syncedMap);
          set({ features: syncedMap, syncStatus: "synced" });
        } else {
          set({ syncStatus: "local" });
        }
      });
    }
  },

  resetDefaults: () => {
    const next = buildDefaultFeatureConfigMap();
    persistConfig(next);
    set({
      features: next,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: isExternalBackendConfigured() ? "syncing" : "local",
    });
    if (isExternalBackendConfigured()) {
      void syncRemoteConfig(next).then((remoteFeatures) => {
        if (remoteFeatures) {
          const syncedMap = mergeRemoteFeaturesInto(get().features, remoteFeatures);
          persistConfig(syncedMap);
          set({ features: syncedMap, syncStatus: "synced" });
        } else {
          set({ syncStatus: "local" });
        }
      });
    }
  },

  hydrateFromRemote: async () => {
    if (!isExternalBackendConfigured()) return;
    try {
      const payload = await apiRequest<{
        features?: Partial<FeatureConfigMap>;
      }>("/api/auth-config");
      if (!payload?.features) return;
      const merged = mergeRemoteFeaturesInto(get().features, payload.features);
      persistConfig(merged);
      set({
        features: merged,
        syncStatus: "synced",
        lastSyncedAt: new Date().toISOString(),
      });
    } catch {
      set({ syncStatus: "local" });
    }
  },
}));

export function assertFeatureEnabled(featureId: BetterAuthFeatureId): void {
  if (!useAuthConfigStore.getState().isFeatureEnabled(featureId)) {
    throw new FeatureDisabledError(featureId);
  }
}
