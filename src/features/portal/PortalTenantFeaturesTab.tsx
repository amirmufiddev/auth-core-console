import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  type TenantFeatureConfigView,
  getPortalTenantFeatures,
  updatePortalTenantFeature,
} from "@/api/feature-tier-service";
import { getTierLabel } from "@/api/tenant-service";
import {
  type BetterAuthFeatureCategory,
  FEATURE_CATEGORY_META,
} from "@/config/better-auth.config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OwnerOnly } from "@/components/layout/Can";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface PortalTenantFeaturesTabProps {
  tenantId: string;
  tierId: string;
}

export function PortalTenantFeaturesTab({
  tenantId,
  tierId,
}: PortalTenantFeaturesTabProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [configuringFeature, setConfiguringFeature] =
    useState<TenantFeatureConfigView | null>(null);
  const [draftSettings, setDraftSettings] = useState<
    Record<string, string | number | boolean>
  >({});
  const [draftSecrets, setDraftSecrets] = useState<Record<string, string>>({});
  const [clearSecretKeys, setClearSecretKeys] = useState<string[]>([]);

  const featuresQuery = useQuery({
    queryKey: ["portal-tenant-features", tenantId],
    queryFn: () => getPortalTenantFeatures(tenantId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updatePortalTenantFeature>[1]) =>
      updatePortalTenantFeature(tenantId, payload),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-features", tenantId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant", tenantId],
      });
      toast.success(`Konfigurasi '${updated.name}' berhasil disimpan.`);
      setConfiguringFeature(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui konfigurasi fitur tenant.",
      );
    },
  });

  const features = useMemo(
    () => featuresQuery.data ?? [],
    [featuresQuery.data],
  );

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      if (categoryFilter !== "all" && f.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.featureCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [features, categoryFilter, search]);

  const openConfigureSheet = (feature: TenantFeatureConfigView) => {
    setConfiguringFeature(feature);
    setDraftSettings({ ...feature.settings });
    const emptySecrets: Record<string, string> = {};
    for (const field of feature.availableSetting) {
      if (field.type === "secret") {
        emptySecrets[field.key] = "";
      }
    }
    setDraftSecrets(emptySecrets);
    setClearSecretKeys([]);
  };

  const handleToggle = (feature: TenantFeatureConfigView, checked: boolean) => {
    updateMutation.mutate({
      featureCode: feature.featureCode,
      enabled: checked,
    });
  };

  const handleSaveSheet = () => {
    if (!configuringFeature) return;
    const cleanSettings: Record<string, string | number | boolean> = {};
    for (const field of configuringFeature.availableSetting) {
      if (field.type === "secret") continue;
      const val = draftSettings[field.key];
      if (field.type === "number") {
        if (val === "" || val === undefined) {
          if (typeof configuringFeature.settings[field.key] === "number") {
            cleanSettings[field.key] = configuringFeature.settings[field.key];
          }
        } else if (Number.isFinite(Number(val))) {
          cleanSettings[field.key] = Number(val);
        }
      } else if (val !== undefined) {
        cleanSettings[field.key] = val;
      }
    }

    const secretsToSend: Record<string, string> = {};
    for (const [key, val] of Object.entries(draftSecrets)) {
      if (val.trim().length > 0) {
        secretsToSend[key] = val;
      }
    }

    updateMutation.mutate({
      featureCode: configuringFeature.featureCode,
      enabled: configuringFeature.configuredEnabled,
      settings: cleanSettings,
      secrets:
        Object.keys(secretsToSend).length > 0 ? secretsToSend : undefined,
      clearSecretKeys:
        clearSecretKeys.length > 0 ? clearSecretKeys : undefined,
    });
  };

  const lockedTierLabel =
    tierId === "tier_free"
      ? "Locked (Butuh Tier Basic+)"
      : "Locked (Butuh Tier Lebih Tinggi)";

  if (featuresQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  if (featuresQuery.isError) {
    return (
      <Alert color="destructive" variant="soft">
        <AlertTitle className="text-sm">
          Gagal Memuat Konfigurasi Fitur IAM
        </AlertTitle>
        <AlertDescription className="text-xs">
          {featuresQuery.error instanceof Error
            ? featuresQuery.error.message
            : "Terjadi kesalahan saat mengambil daftar fitur tenant."}
        </AlertDescription>
      </Alert>
    );
  }

  const enabledCount = features.filter((f) => f.enabled).length;
  const allowedCount = features.filter(
    (f) => f.allowedInTier && f.status === "active",
  ).length;

  return (
    <div className="space-y-4">
      <Alert color="info" variant="soft">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle className="text-sm">
          Konfigurasi IAM Tenant — Tier {getTierLabel(tierId)}
        </AlertTitle>
        <AlertDescription className="text-xs">
          {enabledCount} fitur aktif dari {allowedCount} fitur yang tersedia di
          tier Anda ({features.length} total katalog). Secret yang tersimpan
          dienkripsi AES-256-GCM dan tidak pernah ditampilkan kembali.
        </AlertDescription>
      </Alert>

      {/* Filter Bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari fitur IAM (mis. socialGoogle, twoFactor)..."
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-48" size="sm">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {(
                Object.keys(
                  FEATURE_CATEGORY_META,
                ) as BetterAuthFeatureCategory[]
              ).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {FEATURE_CATEGORY_META[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredFeatures.map((feature) => {
          const isUnavailable =
            feature.status === "disabled" || feature.status === "coming_soon";
          const isLocked = !feature.allowedInTier || isUnavailable;
          const catLabel =
            FEATURE_CATEGORY_META[
              feature.category as BetterAuthFeatureCategory
            ]?.label ?? feature.category;

          const secretKeys = Object.keys(feature.secretsConfigured);
          const configuredSecretCount = secretKeys.filter(
            (k) => feature.secretsConfigured[k],
          ).length;

          return (
            <Card
              key={feature.featureId}
              className={
                feature.enabled
                  ? "border-primary/40 transition-shadow"
                  : isLocked
                    ? "opacity-75"
                    : ""
              }
            >
              <CardHeader className="mb-0 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CardTitle className="text-base font-semibold">
                      {feature.name}
                    </CardTitle>
                    {feature.status === "coming_soon" ? (
                      <Badge
                        color="warning"
                        variant="soft"
                        className="text-[10px]"
                      >
                        Coming Soon
                      </Badge>
                    ) : feature.status === "disabled" ? (
                      <Badge
                        color="secondary"
                        variant="soft"
                        className="text-[10px]"
                      >
                        Disabled
                      </Badge>
                    ) : !feature.allowedInTier ? (
                      <Badge
                        color="warning"
                        variant="outline"
                        className="text-[10px]"
                      >
                        <Lock className="mr-1 h-2.5 w-2.5" />
                        {lockedTierLabel}
                      </Badge>
                    ) : (
                      <Badge
                        color={feature.enabled ? "success" : "secondary"}
                        variant="soft"
                        className="text-[10px]"
                      >
                        {feature.enabled ? "Active" : "Off"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-mono text-[11px]">
                    {feature.featureCode}
                  </CardDescription>
                </div>

                <OwnerOnly>
                  <Switch
                    aria-label={`Toggle ${feature.name}`}
                    checked={feature.enabled}
                    disabled={isLocked || updateMutation.isPending}
                    onCheckedChange={(checked) => handleToggle(feature, checked)}
                  />
                </OwnerOnly>
              </CardHeader>

              <CardContent className="space-y-3 pt-4">
                {secretKeys.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Secrets:</span>
                    <Badge
                      color={
                        configuredSecretCount === secretKeys.length
                          ? "success"
                          : configuredSecretCount > 0
                            ? "warning"
                            : "secondary"
                      }
                      variant="soft"
                      className="text-[10px]"
                    >
                      {configuredSecretCount}/{secretKeys.length} Terkonfigurasi
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Badge
                    color="secondary"
                    variant="outline"
                    className="text-[10px]"
                  >
                    {catLabel}
                  </Badge>
                  <OwnerOnly>
                    <Button
                      size="sm"
                      color="primary"
                      variant={isLocked ? "outline" : "default"}
                      disabled={isLocked || feature.availableSetting.length === 0}
                      onClick={() => openConfigureSheet(feature)}
                    >
                      <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                      {feature.availableSetting.length === 0
                        ? "Tanpa Parameter"
                        : "Configure"}
                    </Button>
                  </OwnerOnly>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configure Feature Settings & Secrets Sheet */}
      <Sheet
        open={Boolean(configuringFeature)}
        onOpenChange={(open) => !open && setConfiguringFeature(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {configuringFeature && (
            <>
              <SheetHeader>
                <SheetTitle>{configuringFeature.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {configuringFeature.featureCode}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {configuringFeature.availableSetting.map((field) => {
                  if (field.type === "secret") {
                    const isConfigured =
                      Boolean(
                        configuringFeature.secretsConfigured[field.key],
                      ) && !clearSecretKeys.includes(field.key);
                    const markedForClear = clearSecretKeys.includes(field.key);

                    return (
                      <div
                        key={field.key}
                        className="space-y-2 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor={`tenant-sec-${field.key}`}>
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
                          ) : isConfigured ? (
                            <Badge
                              color="success"
                              variant="soft"
                              className="text-[10px]"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Terkonfigurasi
                            </Badge>
                          ) : (
                            <Badge
                              color="secondary"
                              variant="soft"
                              className="text-[10px]"
                            >
                              Belum diatur
                            </Badge>
                          )}
                        </div>

                        <Input
                          id={`tenant-sec-${field.key}`}
                          type="password"
                          autoComplete="new-password"
                          placeholder={
                            isConfigured
                              ? "•••••••• (kosongkan untuk mempertahankan)"
                              : "Masukkan secret baru..."
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
                          ) : isConfigured ? (
                            <OwnerOnly>
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
                            </OwnerOnly>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  const val = draftSettings[field.key];
                  if (field.type === "boolean") {
                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <Label htmlFor={`tenant-cfg-${field.key}`}>
                          {field.label}
                        </Label>
                        <Switch
                          id={`tenant-cfg-${field.key}`}
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

                  if (field.type === "select" && field.options?.length) {
                    const normalizedOptions = field.options.map((opt) =>
                      typeof opt === "string"
                        ? { label: opt, value: opt }
                        : { label: opt.label, value: String(opt.value) },
                    );
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <Label>{field.label}</Label>
                        <Select
                          value={String(
                            val ?? normalizedOptions[0]?.value ?? "",
                          )}
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
                            {normalizedOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={`tenant-cfg-${field.key}`}>
                        {field.label}
                      </Label>
                      <Input
                        id={`tenant-cfg-${field.key}`}
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
                <OwnerOnly>
                  <Button
                    type="button"
                    color="primary"
                    disabled={updateMutation.isPending}
                    onClick={handleSaveSheet}
                  >
                    {updateMutation.isPending
                      ? "Menyimpan..."
                      : "Simpan Konfigurasi"}
                  </Button>
                </OwnerOnly>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
