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
        merged[key] = {
          enabled: saved.enabled,
          settings: {
            ...defaults[key].settings,
            ...(saved.settings ?? {}),
          },
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
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(features));
  } catch {
    // ignore quota errors
  }
}

async function syncRemoteConfig(features: FeatureConfigMap): Promise<boolean> {
  if (!isExternalBackendConfigured()) return false;
  try {
    await apiRequest<{ features: Partial<FeatureConfigMap> }>(
      "/api/auth-config",
      {
        method: "PUT",
        body: JSON.stringify({ features }),
      },
    );
    return true;
  } catch {
    return false;
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
  ) => void;
  applyPreset: (preset: ConfigPresetId) => void;
  resetDefaults: () => void;
  hydrateFromRemote: () => Promise<void>;
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
      void syncRemoteConfig(next).then((synced) => {
        set({ syncStatus: synced ? "synced" : "local" });
      });
    }

    return { ok: true, autoEnabled };
  },

  updateFeatureSettings: (id, settings) => {
    const current = get().features;
    const next: FeatureConfigMap = {
      ...current,
      [id]: {
        ...current[id],
        settings: {
          ...current[id].settings,
          ...settings,
        },
      },
    };
    persistConfig(next);
    set({
      features: next,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: isExternalBackendConfigured() ? "syncing" : "local",
    });
    if (isExternalBackendConfigured()) {
      void syncRemoteConfig(next).then((synced) => {
        set({ syncStatus: synced ? "synced" : "local" });
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
      void syncRemoteConfig(next).then((synced) => {
        set({ syncStatus: synced ? "synced" : "local" });
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
      void syncRemoteConfig(next).then((synced) => {
        set({ syncStatus: synced ? "synced" : "local" });
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
      const base = get().features;
      const merged = { ...base };
      for (const key of Object.keys(base) as BetterAuthFeatureId[]) {
        const remote = payload.features[key];
        if (remote && typeof remote.enabled === "boolean") {
          merged[key] = {
            enabled: remote.enabled,
            settings: { ...base[key].settings, ...(remote.settings ?? {}) },
          };
        }
      }
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
