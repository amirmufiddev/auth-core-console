import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  Building2,
  CheckCircle2,
  CreditCard,
  Layers,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  TENANT_TIER_OPTIONS,
  type TenantRecord,
  type TenantStatus,
  adminCreateTenant,
  adminListTenants,
  adminUpdateTenantStatus,
  adminUpdateTenantTier,
  slugifyTenantName,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  type AdminChangeTierValues,
  type AdminCreateTenantValues,
  type AdminTenantsSearchParams,
  adminChangeTierSchema,
  adminCreateTenantSchema,
} from "@/features/admin-tenants/schema";
import {
  TenantBillingStatusBadge,
  TenantStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Can } from "@/components/layout/Can";

interface AdminTenantsPageProps {
  searchParams: AdminTenantsSearchParams;
  onUpdateSearch: (patch: Partial<AdminTenantsSearchParams>) => void;
}

export function AdminTenantsPage({
  searchParams,
  onUpdateSearch,
}: AdminTenantsPageProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [createOpen, setCreateOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tierTarget, setTierTarget] = useState<TenantRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    tenant: TenantRecord;
    nextStatus: TenantStatus;
  } | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", searchParams],
    queryFn: () =>
      adminListTenants({
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        search: searchParams.search || undefined,
        status: searchParams.status === "all" ? undefined : searchParams.status,
        tierId: searchParams.tierId === "all" ? undefined : searchParams.tierId,
      }),
  });

  const createForm = useForm<AdminCreateTenantValues>({
    resolver: zodResolver(adminCreateTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      ownerUserId: currentUser?.id ?? "",
      tierId: "tier_free",
      billingStatus: "active",
    },
  });

  const tierForm = useForm<AdminChangeTierValues>({
    resolver: zodResolver(adminChangeTierSchema),
    defaultValues: {
      tierId: "tier_free",
    },
  });

  const createMutation = useMutation({
    mutationFn: adminCreateTenant,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(`Tenant '${created.name}' berhasil dibuat.`);
      setCreateOpen(false);
      setSlugTouched(false);
      createForm.reset({
        name: "",
        slug: "",
        ownerUserId: currentUser?.id ?? "",
        tierId: "tier_free",
        billingStatus: "active",
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat tenant baru.",
      );
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ tenantId, tierId }: { tenantId: string; tierId: string }) =>
      adminUpdateTenantTier(tenantId, tierId),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(
        `Tier tenant '${updated.name}' diperbarui (config v${updated.configVersion}).`,
      );
      setTierTarget(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah tier tenant.",
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      tenantId,
      status,
    }: {
      tenantId: string;
      status: TenantStatus;
    }) => adminUpdateTenantStatus(tenantId, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(
        updated.status === "suspended"
          ? `Tenant '${updated.name}' ditangguhkan.`
          : `Tenant '${updated.name}' diaktifkan kembali.`,
      );
      setStatusTarget(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status tenant.",
      );
    },
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const total = tenantsQuery.data?.total ?? 0;
  const activeCount = tenants.filter((t) => t.status === "active").length;
  const suspendedCount = tenants.filter((t) => t.status === "suspended").length;
  const paidTierCount = tenants.filter((t) => t.tierId !== "tier_free").length;

  const openCreateDialog = () => {
    setSlugTouched(false);
    createForm.reset({
      name: "",
      slug: "",
      ownerUserId: currentUser?.id ?? "",
      tierId: "tier_free",
      billingStatus: "active",
    });
    setCreateOpen(true);
  };

  const openChangeTierDialog = (tenant: TenantRecord) => {
    tierForm.reset({ tierId: tenant.tierId });
    setTierTarget(tenant);
  };

  const columns: ColumnDef<TenantRecord>[] = [
    {
      accessorKey: "name",
      header: "Tenant",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-default-900">
            {row.original.name}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.slug} · {row.original.id}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "ownerUserId",
      header: "Owner ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-default-700">
          {row.original.ownerUserId}
        </span>
      ),
    },
    {
      accessorKey: "tierId",
      header: "Tier",
      cell: ({ row }) => <TenantTierBadge tierId={row.original.tierId} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TenantStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "billingStatus",
      header: "Billing",
      cell: ({ row }) => (
        <TenantBillingStatusBadge status={row.original.billingStatus} />
      ),
    },
    {
      accessorKey: "configVersion",
      header: "Config / Dibuat",
      cell: ({ row }) => (
        <div>
          <div className="tabular-nums text-xs font-medium text-default-800">
            v{row.original.configVersion}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const tenant = row.original;
        const isActive = tenant.status === "active";
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  color="secondary"
                  className="h-8 w-8"
                  aria-label="Aksi tenant"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Can resource="organization" action="update">
                  <DropdownMenuItem
                    onClick={() => openChangeTierDialog(tenant)}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Ubah Tier Langganan
                  </DropdownMenuItem>
                </Can>
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin-billing"
                    search={{
                      page: 0,
                      pageSize: 10,
                      tenantId: tenant.id,
                      tierId: "all",
                      status: "all",
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Lihat Ledger Billing
                  </Link>
                </DropdownMenuItem>
                <Can resource="organization" action="update">
                  <DropdownMenuSeparator />
                  {isActive ? (
                    <DropdownMenuItem
                      onClick={() =>
                        setStatusTarget({ tenant, nextStatus: "suspended" })
                      }
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend Tenant
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() =>
                        setStatusTarget({ tenant, nextStatus: "active" })
                      }
                      className="text-success focus:text-success"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Activate Tenant
                    </DropdownMenuItem>
                  )}
                </Can>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Direktori tenant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola tenant multi-tenant, upgrade/downgrade tier, dan kontrol
            aktivasi/suspensi.
          </p>
        </div>
        <Can resource="organization" action="create">
          <Button color="primary" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Tenant
          </Button>
        </Can>
      </div>

      {tenantsQuery.isError && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">Gagal Memuat Daftar Tenant</AlertTitle>
          <AlertDescription className="text-xs">
            {(tenantsQuery.error as Error)?.message ?? "Gagal memuat data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Cocok Filter</span>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Aktif (Halaman)</span>
              <ShieldCheck className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ditangguhkan (Halaman)</span>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {suspendedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tier Berbayar (Halaman)</span>
              <Layers className="h-4 w-4 text-info" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {paidTierCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Daftar Tenant Platform
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={searchParams.status}
              onValueChange={(val) =>
                onUpdateSearch({
                  status: val as AdminTenantsSearchParams["status"],
                  page: 0,
                })
              }
            >
              <SelectTrigger className="h-9 w-36" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.tierId}
              onValueChange={(val) => onUpdateSearch({ tierId: val, page: 0 })}
            >
              <SelectTrigger className="h-9 w-40" size="sm">
                <SelectValue placeholder="Filter Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tier</SelectItem>
                {TENANT_TIER_OPTIONS.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={tenants}
            totalCount={total}
            pageIndex={searchParams.page}
            pageSize={searchParams.pageSize}
            onPaginationChange={(next) =>
              onUpdateSearch({ page: next.pageIndex, pageSize: next.pageSize })
            }
            searchValue={searchParams.search}
            onSearchChange={(val) => onUpdateSearch({ search: val, page: 0 })}
            searchPlaceholder="Cari nama atau slug tenant..."
            isLoading={tenantsQuery.isLoading}
          />
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Buat Tenant Baru (Operator)</DialogTitle>
            <DialogDescription>
              Daftarkan tenant baru beserta pemilik, slug unik, dan tier awal.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((vals) =>
              createMutation.mutate(vals),
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="op-ten-name">Nama Tenant</Label>
              <Input
                id="op-ten-name"
                placeholder="Mis. Acme Corporation"
                {...createForm.register("name", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (!slugTouched) {
                      createForm.setValue(
                        "slug",
                        slugifyTenantName(e.target.value),
                      );
                    }
                  },
                })}
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="op-ten-slug">Slug Tenant (Immutable)</Label>
              <Input
                id="op-ten-slug"
                placeholder="acme-corp"
                className="font-mono text-sm"
                {...createForm.register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              {createForm.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="op-ten-owner">Owner User ID</Label>
              <Input
                id="op-ten-owner"
                placeholder="usr_..."
                className="font-mono text-sm"
                {...createForm.register("ownerUserId")}
              />
              {createForm.formState.errors.ownerUserId && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.ownerUserId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Controller
                  control={createForm.control}
                  name="tierId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TENANT_TIER_OPTIONS.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Billing Status Awal</Label>
                <Controller
                  control={createForm.control}
                  name="billingStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="manual_invoice">
                          Manual Invoice
                        </SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Menyimpan..." : "Buat Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog
        open={Boolean(tierTarget)}
        onOpenChange={(open) => !open && setTierTarget(null)}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Ubah Tier Tenant</DialogTitle>
            <DialogDescription>
              {tierTarget
                ? `Pilih tier baru untuk ${tierTarget.name} (${tierTarget.slug}).`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={tierForm.handleSubmit((vals) => {
              if (!tierTarget) return;
              updateTierMutation.mutate({
                tenantId: tierTarget.id,
                tierId: vals.tierId,
              });
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Tier Paket</Label>
              <Controller
                control={tierForm.control}
                name="tierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_TIER_OPTIONS.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name} — {tier.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => setTierTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={updateTierMutation.isPending}
              >
                {updateTierMutation.isPending ? "Memperbarui..." : "Simpan Tier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suspend / Activate Confirmation */}
      <AlertDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.nextStatus === "suspended"
                ? "Tangguhkan Tenant?"
                : "Aktifkan Kembali Tenant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.nextStatus === "suspended"
                ? `Tenant '${statusTarget.tenant.name}' (${statusTarget.tenant.slug}) akan dinonaktifkan dan slug cache akan di-invalidasi.`
                : `Tenant '${statusTarget?.tenant.name}' akan diaktifkan kembali dan dapat melayani autentikasi.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel color="secondary" variant="outline">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              color={
                statusTarget?.nextStatus === "suspended"
                  ? "destructive"
                  : "success"
              }
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (!statusTarget) return;
                updateStatusMutation.mutate({
                  tenantId: statusTarget.tenant.id,
                  status: statusTarget.nextStatus,
                });
              }}
            >
              {statusTarget?.nextStatus === "suspended"
                ? "Ya, Suspend"
                : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
