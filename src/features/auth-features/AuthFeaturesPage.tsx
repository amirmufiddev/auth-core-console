import { useState } from "react";
import {
  CheckCircle2,
  Code2,
  Copy,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  BETTER_AUTH_FEATURES,
  type BetterAuthFeatureCategory,
  type BetterAuthFeatureDefinition,
  type ConfigPresetId,
  FEATURE_CATEGORY_META,
  generateBetterAuthClientSnippet,
  generateBetterAuthServerSnippet,
  generateEnvSnippet,
} from "@/config/better-auth.config";
import { useAuthConfigStore } from "@/stores/useAuthConfigStore";
import { type AuthFeaturesSearchParams } from "@/features/audit-logs/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/layout/Can";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AuthFeaturesPageProps {
  searchParams: AuthFeaturesSearchParams;
  onUpdateSearch: (patch: Partial<AuthFeaturesSearchParams>) => void;
}

export function AuthFeaturesPage({
  searchParams,
  onUpdateSearch,
}: AuthFeaturesPageProps) {
  const features = useAuthConfigStore((s) => s.features);
  const syncStatus = useAuthConfigStore((s) => s.syncStatus);
  const toggleFeature = useAuthConfigStore((s) => s.toggleFeature);
  const updateFeatureSettings = useAuthConfigStore(
    (s) => s.updateFeatureSettings,
  );
  const applyPreset = useAuthConfigStore((s) => s.applyPreset);
  const resetDefaults = useAuthConfigStore((s) => s.resetDefaults);

  const [exportOpen, setExportOpen] = useState(false);
  const [configuringFeature, setConfiguringFeature] =
    useState<BetterAuthFeatureDefinition | null>(null);
  const [draftSettings, setDraftSettings] = useState<
    Record<string, string | number | boolean>
  >({});
  const [draftSecrets, setDraftSecrets] = useState<Record<string, string>>({});
  const [clearSecretKeys, setClearSecretKeys] = useState<string[]>([]);

  const totalCount = BETTER_AUTH_FEATURES.length;
  const activeCount = BETTER_AUTH_FEATURES.filter(
    (f) => features[f.id]?.enabled,
  ).length;
  const disabledCount = totalCount - activeCount;

  const filteredFeatures = BETTER_AUTH_FEATURES.filter((feature) => {
    const enabled = Boolean(features[feature.id]?.enabled);
    if (
      searchParams.category !== "all" &&
      feature.category !== searchParams.category
    ) {
      return false;
    }
    if (searchParams.status === "enabled" && !enabled) return false;
    if (searchParams.status === "disabled" && enabled) return false;
    if (searchParams.search) {
      const q = searchParams.search.toLowerCase();
      return (
        feature.name.toLowerCase().includes(q) ||
        feature.description.toLowerCase().includes(q) ||
        feature.packageName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggle = (
    feature: BetterAuthFeatureDefinition,
    checked: boolean,
  ) => {
    const result = toggleFeature(feature.id, checked);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal mengubah status plugin.");
      return;
    }
    if (result.autoEnabled?.length) {
      toast.success(
        `${feature.name} aktif (+ dependensi: ${result.autoEnabled.join(", ")})`,
      );
    } else {
      toast.success(
        `${feature.name} ${checked ? "diaktifkan" : "dinonaktifkan"}.`,
      );
    }
  };

  const openConfigureSheet = (feature: BetterAuthFeatureDefinition) => {
    setConfiguringFeature(feature);
    const currentSettings =
      features[feature.id]?.settings ?? feature.defaultSettings;
    const nextDraft: Record<string, string | number | boolean> = {};
    const nextSecrets: Record<string, string> = {};
    for (const field of feature.settingsSchema) {
      if (field.type === "secret") {
        nextSecrets[field.key] = "";
      } else if (field.key in currentSettings) {
        nextDraft[field.key] = currentSettings[field.key];
      } else if (field.key in feature.defaultSettings) {
        nextDraft[field.key] = feature.defaultSettings[field.key];
      }
    }
    setDraftSettings(nextDraft);
    setDraftSecrets(nextSecrets);
    setClearSecretKeys([]);
  };

  const saveFeatureSettings = () => {
    if (!configuringFeature) return;
    const existingSettings =
      features[configuringFeature.id]?.settings ??
      configuringFeature.defaultSettings;
    const cleanSettings: Record<string, string | number | boolean> = {};
    for (const field of configuringFeature.settingsSchema) {
      if (field.type === "secret") continue;
      const incoming = draftSettings[field.key];
      if (field.type === "number") {
        if (incoming === "" || incoming === undefined) {
          if (typeof existingSettings[field.key] === "number") {
            cleanSettings[field.key] = existingSettings[field.key];
          }
        } else if (Number.isFinite(Number(incoming))) {
          cleanSettings[field.key] = Number(incoming);
        }
      } else if (incoming !== undefined) {
        cleanSettings[field.key] = incoming;
      }
    }

    const secretsToSend: Record<string, string> = {};
    for (const [key, val] of Object.entries(draftSecrets)) {
      if (val.trim().length > 0) {
        secretsToSend[key] = val;
      }
    }

    updateFeatureSettings(configuringFeature.id, cleanSettings, {
      secrets:
        Object.keys(secretsToSend).length > 0 ? secretsToSend : undefined,
      clearSecretKeys:
        clearSecretKeys.length > 0 ? clearSecretKeys : undefined,
    });
    toast.success(`Parameter ${configuringFeature.name} diperbarui.`);
    setConfiguringFeature(null);
  };

  const serverCode = generateBetterAuthServerSnippet(features);
  const clientCode = generateBetterAuthClientSnippet(features);
  const envCode = generateEnvSnippet(features);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Auth Core Feature & Plugin Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aktifkan, nonaktifkan, dan atur parameter setiap fitur Auth Core
            untuk Auth Service Anda secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Can resource="authConfig" action="configure">
            <Select
              onValueChange={(val) => {
                applyPreset(val as ConfigPresetId);
                toast.success(`Preset "${val}" diterapkan.`);
              }}
            >
              <SelectTrigger className="h-9 w-44" size="sm">
                <SelectValue placeholder="Terapkan Preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal Core</SelectItem>
                <SelectItem value="saas">SaaS Starter</SelectItem>
                <SelectItem value="enterprise">Enterprise IAM</SelectItem>
                <SelectItem value="full">Enable All ({totalCount})</SelectItem>
              </SelectContent>
            </Select>
          </Can>

          <Button
            variant="outline"
            color="secondary"
            onClick={() => setExportOpen(true)}
          >
            <Code2 className="mr-2 h-4 w-4" />
            Export Config
          </Button>

          <Button
            variant="outline"
            color="warning"
            onClick={() => {
              resetDefaults();
              toast.info("Konfigurasi dikembalikan ke default.");
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Katalog Fitur</span>
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {totalCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fitur Aktif</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-bold text-success">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fitur Non-Aktif</span>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {disabledCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mode Sinkronisasi</span>
              <Badge
                color={syncStatus === "synced" ? "success" : "info"}
                variant="soft"
              >
                {syncStatus}
              </Badge>
            </div>
            <div className="mt-2 text-sm font-medium text-default-900">
              Hybrid Env + Runtime Store
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Category Tabs */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchParams.search}
                onChange={(e) => onUpdateSearch({ search: e.target.value })}
                placeholder="Cari plugin (mis. passkey, scim, stripe)..."
                className="pl-9"
              />
            </div>

            <Select
              value={searchParams.status}
              onValueChange={(val) =>
                onUpdateSearch({
                  status: val as AuthFeaturesSearchParams["status"],
                })
              }
            >
              <SelectTrigger className="h-9 w-40" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="enabled">Aktif Saja</SelectItem>
                <SelectItem value="disabled">Non-Aktif Saja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={searchParams.category}
            onValueChange={(val) =>
              onUpdateSearch({
                category: val as AuthFeaturesSearchParams["category"],
              })
            }
          >
            <TabsList className="h-auto flex-wrap justify-start gap-1 p-1">
              <TabsTrigger value="all">Semua ({totalCount})</TabsTrigger>
              {(
                Object.keys(
                  FEATURE_CATEGORY_META,
                ) as BetterAuthFeatureCategory[]
              ).map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {FEATURE_CATEGORY_META[cat].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredFeatures.map((feature) => {
          const runtime = features[feature.id];
          const enabled = Boolean(runtime?.enabled);
          return (
            <Card
              key={feature.id}
              className={
                enabled
                  ? "border-primary/40 transition-shadow"
                  : "opacity-85 transition-opacity"
              }
            >
              <CardHeader className="mb-0 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold">
                      {feature.name}
                    </CardTitle>
                    <Badge
                      color={enabled ? "success" : "secondary"}
                      variant="soft"
                      className="text-[10px]"
                    >
                      {enabled ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-[11px]">
                    {feature.packageName} · {feature.pluginKey}
                  </CardDescription>
                </div>

                <Can resource="authConfig" action="configure">
                  <Switch
                    aria-label={`Toggle ${feature.name}`}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      handleToggle(feature, checked)
                    }
                  />
                </Can>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {feature.endpoints.slice(0, 2).map((ep) => (
                    <span
                      key={ep}
                      className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-default-700"
                    >
                      {ep}
                    </span>
                  ))}
                </div>

                {feature.dependencies?.length ? (
                  <div className="text-[11px] text-muted-foreground">
                    Memerlukan:{" "}
                    <span className="font-semibold text-default-800">
                      {feature.dependencies.join(", ")}
                    </span>
                  </div>
                ) : null}

                {feature.settingsSchema.some((s) => s.type === "secret") ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">Platform Secrets:</span>
                    {feature.settingsSchema
                      .filter((s) => s.type === "secret")
                      .map((s) => {
                        const configured = Boolean(
                          runtime?.secretsConfigured?.[s.key],
                        );
                        return (
                          <Badge
                            key={s.key}
                            color={configured ? "success" : "secondary"}
                            variant="soft"
                            className="text-[10px]"
                          >
                            {s.key}: {configured ? "Terkonfigurasi" : "Belum diatur"}
                          </Badge>
                        );
                      })}
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Badge
                    color="secondary"
                    variant="outline"
                    className="text-[10px]"
                  >
                    {FEATURE_CATEGORY_META[feature.category].label}
                  </Badge>
                  <Can resource="authConfig" action="configure">
                    <Button
                      size="sm"
                      color="primary"
                      onClick={() => openConfigureSheet(feature)}
                    >
                      <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                      Configure
                    </Button>
                  </Can>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configure Feature Settings Sheet */}
      <Sheet
        open={Boolean(configuringFeature)}
        onOpenChange={(open) => !open && setConfiguringFeature(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {configuringFeature && (
            <>
              <SheetHeader>
                <SheetTitle>{configuringFeature.name}</SheetTitle>
                <SheetDescription>
                  {configuringFeature.packageName} ·{" "}
                  {configuringFeature.pluginKey}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {configuringFeature.settingsSchema.map((field) => {
                  const val = draftSettings[field.key];
                  if (field.type === "boolean") {
                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <Label htmlFor={`cfg-${field.key}`}>
                          {field.label}
                        </Label>
                        <Switch
                          id={`cfg-${field.key}`}
                          checked={Boolean(val)}
                          onCheckedChange={(checked) =>
                            setDraftSettings((prev) => ({
                              ...prev,
                              [field.key]: checked,
                            }))
                          }
                        />
                      </div>
                    );
                  }
                  if (field.type === "select" && field.options) {
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{field.label}</Label>
                        <Select
                          value={String(val ?? field.options[0])}
                          onValueChange={(nextVal) =>
                            setDraftSettings((prev) => ({
                              ...prev,
                              [field.key]: nextVal,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  if (field.type === "secret") {
                    const markedForClear = clearSecretKeys.includes(field.key);
                    const secretsConfigured =
                      Boolean(
                        features[configuringFeature.id]?.secretsConfigured?.[
                          field.key
                        ],
                      ) && !markedForClear;
                    return (
                      <div
                        key={field.key}
                        className="space-y-2 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor={`cfg-${field.key}`}>
                            {field.label}
                          </Label>
                          {markedForClear ? (
                            <Badge
                              color="destructive"
                              variant="soft"
                              className="text-[10px]"
                            >
                              Akan dihapus
                            </Badge>
                          ) : (
                            <Badge
                              color={secretsConfigured ? "success" : "secondary"}
                              variant="soft"
                              className="text-[10px]"
                            >
                              {secretsConfigured
                                ? "Terkonfigurasi"
                                : "Belum diatur"}
                            </Badge>
                          )}
                        </div>
                        <Input
                          id={`cfg-${field.key}`}
                          type="password"
                          autoComplete="new-password"
                          placeholder={
                            secretsConfigured
                              ? "•••••••• (kosongkan untuk mempertahankan)"
                              : "Masukkan secret platform..."
                          }
                          value={draftSecrets[field.key] ?? ""}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            setDraftSecrets((prev) => ({
                              ...prev,
                              [field.key]: nextVal,
                            }));
                            if (nextVal.length > 0 && markedForClear) {
                              setClearSecretKeys((prev) =>
                                prev.filter((k) => k !== field.key),
                              );
                            }
                          }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-muted-foreground">
                            Nilai kosong tidak akan menimpa secret lama.
                          </p>
                          {markedForClear ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              color="secondary"
                              className="h-7 px-2 text-[11px]"
                              onClick={() =>
                                setClearSecretKeys((prev) =>
                                  prev.filter((k) => k !== field.key),
                                )
                              }
                            >
                              Batal Hapus
                            </Button>
                          ) : secretsConfigured ? (
                            <Can resource="authConfig" action="configure">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                color="destructive"
                                className="h-7 px-2 text-[11px]"
                                onClick={() =>
                                  setClearSecretKeys((prev) =>
                                    prev.includes(field.key)
                                      ? prev
                                      : [...prev, field.key],
                                  )
                                }
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Hapus
                              </Button>
                            </Can>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={`cfg-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`cfg-${field.key}`}
                        type={field.type === "number" ? "number" : "text"}
                        value={String(val ?? "")}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          setDraftSettings((prev) => ({
                            ...prev,
                            [field.key]:
                              field.type === "number"
                                ? rawVal === ""
                                  ? ""
                                  : Number(rawVal)
                                : rawVal,
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <SheetFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  color="secondary"
                  onClick={() => setConfiguringFeature(null)}
                >
                  Batal
                </Button>
                <Can resource="authConfig" action="configure">
                  <Button
                    type="button"
                    color="primary"
                    onClick={saveFeatureSettings}
                  >
                    Simpan Parameter
                  </Button>
                </Can>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Export Better Auth Config Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Export Konfigurasi Auth Core</DialogTitle>
            <DialogDescription>
              Kode berikut digenerate otomatis hanya untuk {activeCount} fitur
              yang sedang aktif di Auth Core.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="server">
            <TabsList>
              <TabsTrigger value="server">auth.ts (Server)</TabsTrigger>
              <TabsTrigger value="client">auth-client.ts</TabsTrigger>
              <TabsTrigger value="env">.env.example</TabsTrigger>
            </TabsList>

            <TabsContent value="server" className="space-y-2 pt-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  color="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(serverCode);
                    toast.success("auth.ts disalin.");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Salin
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted p-4 font-semibold text-xs text-default-900">
                <code>{serverCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="client" className="space-y-2 pt-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  color="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(clientCode);
                    toast.success("auth-client.ts disalin.");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Salin
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted p-4 font-semibold text-xs text-default-900">
                <code>{clientCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="env" className="space-y-2 pt-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  color="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(envCode);
                    toast.success(".env flags disalin.");
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Salin
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted p-4 font-semibold text-xs text-default-900">
                <code>{envCode}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
