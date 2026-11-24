import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Layers,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  type AdminFeatureRecord,
  type AdminTierRecord,
  type AuthFeatureStatus,
  adminListFeatures,
  adminListTiers,
  adminUpdateFeatureStatus,
  adminUpdateTierFeatures,
} from "@/api/feature-tier-service";
import {
  type BetterAuthFeatureCategory,
  FEATURE_CATEGORY_META,
} from "@/config/better-auth.config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_BADGE_MAP: Record<
  AuthFeatureStatus,
  { label: string; color: "success" | "secondary" | "warning" }
> = {
  active: { label: "Active", color: "success" },
  disabled: { label: "Disabled", color: "secondary" },
  coming_soon: { label: "Coming Soon", color: "warning" },
};

export function AdminFeatureTierMatrixPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AuthFeatureStatus>(
    "all",
  );

  // Draft map: tierId -> Set<featureId>
  const [draftTierFeatures, setDraftTierFeatures] = useState<
    Record<string, string[]>
  >({});

  const featuresQuery = useQuery({
    queryKey: ["admin-features"],
    queryFn: adminListFeatures,
  });

  const tiersQuery = useQuery({
    queryKey: ["admin-tiers"],
    queryFn: adminListTiers,
  });

  const sortedTiers = useMemo<AdminTierRecord[]>(() => {
    return [...(tiersQuery.data ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [tiersQuery.data]);

  useEffect(() => {
    if (tiersQuery.data) {
      const initial: Record<string, string[]> = {};
      for (const tier of tiersQuery.data) {
        initial[tier.id] = [...tier.featureIds];
      }
      setDraftTierFeatures(initial);
    }
  }, [tiersQuery.data]);

  const dirtyTierIds = useMemo(() => {
    const dirty: string[] = [];
    for (const tier of sortedTiers) {
      const orig = new Set(tier.featureIds);
      const draft = new Set(draftTierFeatures[tier.id] ?? tier.featureIds);
      if (orig.size !== draft.size) {
        dirty.push(tier.id);
        continue;
      }
      for (const id of orig) {
        if (!draft.has(id)) {
          dirty.push(tier.id);
          break;
        }
      }
    }
    return dirty;
  }, [sortedTiers, draftTierFeatures]);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      featureId,
      status,
    }: {
      featureId: string;
      status: AuthFeatureStatus;
    }) => adminUpdateFeatureStatus(featureId, status),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-features"] });
      toast.success(
        `Status '${res.feature.name}' diubah ke ${res.feature.status} (catalog v${res.catalogVersion}).`,
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status fitur.",
      );
    },
  });

  const saveMatrixMutation = useMutation({
    mutationFn: async (tierIdsToSave: string[]) => {
      const results = await Promise.all(
        tierIdsToSave.map((tierId) =>
          adminUpdateTierFeatures(tierId, draftTierFeatures[tierId] ?? []),
        ),
      );
      return results;
    },
    onSuccess: (results) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tiers"] });
      const latestVersion = results[results.length - 1]?.catalogVersion ?? 0;
      toast.success(
        `Matriks ${results.length} tier berhasil disimpan (catalog v${latestVersion}).`,
      );
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan matriks tier.",
      );
    },
  });

  const features = useMemo(
    () => featuresQuery.data ?? [],
    [featuresQuery.data],
  );
  const filteredFeatures = useMemo<AdminFeatureRecord[]>(() => {
    return features.filter((f) => {
      if (categoryFilter !== "all" && f.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && f.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.packageName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [features, categoryFilter, statusFilter, search]);

  const toggleTierFeature = (
    tierId: string,
    featureId: string,
    checked: boolean,
  ) => {
    setDraftTierFeatures((prev) => {
      const current = new Set(prev[tierId] ?? []);
      if (checked) {
        current.add(featureId);
      } else {
        current.delete(featureId);
      }
      return {
        ...prev,
        [tierId]: Array.from(current),
      };
    });
  };

  const resetDraft = () => {
    if (!tiersQuery.data) return;
    const initial: Record<string, string[]> = {};
    for (const tier of tiersQuery.data) {
      initial[tier.id] = [...tier.featureIds];
    }
    setDraftTierFeatures(initial);
  };

  if (featuresQuery.isError || tiersQuery.isError) {
    const err = featuresQuery.error ?? tiersQuery.error;
    return (
      <Alert color="destructive" variant="soft">
        <AlertTitle>Gagal Memuat Matriks Fitur & Tier</AlertTitle>
        <AlertDescription>
          {err instanceof Error
            ? err.message
            : "Pastikan Anda memiliki izin operator platform (authConfig:configure)."}
        </AlertDescription>
      </Alert>
    );
  }

  const activeCount = features.filter((f) => f.status === "active").length;
  const disabledCount = features.filter((f) => f.status === "disabled").length;
  const comingSoonCount = features.filter(
    (f) => f.status === "coming_soon",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Feature & Tier Matrix (Operator)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola status ketersediaan fitur katalog dan hak akses fitur per
            tier langganan secara real-time.
          </p>
        </div>

        <Can resource="authConfig" action="configure">
          <div className="flex flex-wrap items-center gap-2">
            {dirtyTierIds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={resetDraft}
                disabled={saveMatrixMutation.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset ({dirtyTierIds.length} tier)
              </Button>
            )}
            <Button
              type="button"
              color="primary"
              disabled={
                dirtyTierIds.length === 0 || saveMatrixMutation.isPending
              }
              onClick={() => saveMatrixMutation.mutate(dirtyTierIds)}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMatrixMutation.isPending
                ? "Menyimpan..."
                : dirtyTierIds.length > 0
                  ? `Simpan Matriks (${dirtyTierIds.length} Tier)`
                  : "Matriks Tersimpan"}
            </Button>
          </div>
        </Can>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Fitur Katalog</span>
              <SlidersHorizontal className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {features.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Active</span>
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
              <span>Coming Soon / Disabled</span>
              <Layers className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {comingSoonCount} / {disabledCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Tier</span>
              <Layers className="h-4 w-4 text-info" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {sortedTiers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode fitur..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-44" size="sm">
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

            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as "all" | AuthFeatureStatus)
              }
            >
              <SelectTrigger className="h-9 w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Matriks Fitur & Tier ({filteredFeatures.length})
          </CardTitle>
          <CardDescription>
            Perubahan status fitur langsung menginvalidasi catalogVersion.
            Centang kolom tier lalu klik Simpan Matriks untuk memperbarui hak
            akses tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {featuresQuery.isLoading || tiersQuery.isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Fitur</TableHead>
                    <TableHead className="min-w-[130px]">Kategori</TableHead>
                    <TableHead className="min-w-[160px]">Status</TableHead>
                    {sortedTiers.map((tier) => {
                      const count = (
                        draftTierFeatures[tier.id] ?? tier.featureIds
                      ).length;
                      const isDirty = dirtyTierIds.includes(tier.id);
                      return (
                        <TableHead
                          key={tier.id}
                          className="min-w-[110px] text-center"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-semibold text-default-900">
                              {tier.name}
                            </span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {count} fitur{isDirty ? " *" : ""}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeatures.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3 + sortedTiers.length}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada fitur yang cocok dengan filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeatures.map((feature) => {
                      const statusMeta = STATUS_BADGE_MAP[feature.status];
                      const catLabel =
                        FEATURE_CATEGORY_META[
                          feature.category as BetterAuthFeatureCategory
                        ]?.label ?? feature.category;

                      return (
                        <TableRow key={feature.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-default-900">
                                  {feature.name}
                                </span>
                                <Badge
                                  color={statusMeta.color}
                                  variant="soft"
                                  className="text-[10px]"
                                >
                                  {statusMeta.label}
                                </Badge>
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {feature.code}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              color="secondary"
                              variant="outline"
                              className="text-[10px]"
                            >
                              {catLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Can resource="authConfig" action="configure">
                              <Select
                                value={feature.status}
                                disabled={updateStatusMutation.isPending}
                                onValueChange={(val) =>
                                  updateStatusMutation.mutate({
                                    featureId: feature.id,
                                    status: val as AuthFeatureStatus,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-36" size="sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="coming_soon">
                                    Coming Soon
                                  </SelectItem>
                                  <SelectItem value="disabled">
                                    Disabled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Can>
                          </TableCell>
                          {sortedTiers.map((tier) => {
                            const checked = (
                              draftTierFeatures[tier.id] ?? tier.featureIds
                            ).includes(feature.id);
                            return (
                              <TableCell key={tier.id} className="text-center">
                                <div className="flex justify-center">
                                  <Checkbox
                                    aria-label={`${feature.name} di tier ${tier.name}`}
                                    checked={checked}
                                    onCheckedChange={(val) =>
                                      toggleTierFeature(
                                        tier.id,
                                        feature.id,
                                        Boolean(val),
                                      )
                                    }
                                  />
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
