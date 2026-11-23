import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  Building2,
  Globe,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type TenantRecord,
  createMyTenant,
  listMyTenants,
  slugifyTenantName,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  type CreatePortalTenantValues,
  type PortalTenantsSearchParams,
  createPortalTenantSchema,
} from "@/features/portal/schema";
import {
  TenantBillingStatusBadge,
  TenantStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortalTenantsPageProps {
  searchParams: PortalTenantsSearchParams;
  onUpdateSearch: (patch: Partial<PortalTenantsSearchParams>) => void;
}

export function PortalTenantsPage({
  searchParams,
  onUpdateSearch,
}: PortalTenantsPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ["portal-tenants", searchParams],
    queryFn: () =>
      listMyTenants({
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        search: searchParams.search || undefined,
        status: searchParams.status === "all" ? undefined : searchParams.status,
      }),
  });

  const form = useForm<CreatePortalTenantValues>({
    resolver: zodResolver(createPortalTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: createMyTenant,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["portal-tenants"] });
      toast.success(`Tenant '${created.name}' berhasil dibuat.`);
      setCreateOpen(false);
      setSlugTouched(false);
      form.reset();
      void navigate({
        to: "/tenants/$tenantId",
        params: { tenantId: created.id },
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat tenant baru.",
      );
    },
  });

  const openCreateDialog = () => {
    setSlugTouched(false);
    form.reset({ name: "", slug: "" });
    setCreateOpen(true);
  };

  const tenants = tenantsQuery.data?.items ?? [];
  const total = tenantsQuery.data?.total ?? 0;
  const activeCount = tenants.filter((t) => t.status === "active").length;
  const suspendedCount = tenants.filter((t) => t.status === "suspended").length;

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
            /{row.original.slug}
          </div>
        </div>
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
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" color="primary" asChild>
            <Link
              to="/tenants/$tenantId"
              params={{ tenantId: row.original.id }}
            >
              Kelola Tenant
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Portal Pelanggan — Tenant Saya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat dan kelola tenant aplikasi, OAuth 2.1 / MCP client, dan
            riwayat billing Anda.
          </p>
        </div>
        <Button color="primary" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tenant Baru
        </Button>
      </div>

      {tenantsQuery.isError && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">Gagal Memuat Daftar Tenant</AlertTitle>
          <AlertDescription className="text-xs">
            {tenantsQuery.error instanceof Error
              ? tenantsQuery.error.message
              : "Pastikan Anda masuk dengan akun platform untuk mengakses portal pelanggan."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Tenant Anda</span>
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
              <span>Tenant Aktif (Halaman)</span>
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
      </div>

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-4 w-4 text-primary" />
            Daftar Tenant Milik Anda
          </CardTitle>
          <Controller
            control={form.control}
            name="name"
            render={() => (
              <Select
                value={searchParams.status}
                onValueChange={(val) =>
                  onUpdateSearch({
                    status: val as PortalTenantsSearchParams["status"],
                    page: 0,
                  })
                }
              >
                <SelectTrigger className="h-9 w-40" size="sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
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

      {/* Create Portal Tenant Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Buat Tenant Baru</DialogTitle>
            <DialogDescription>
              Tenant baru otomatis dimulai pada tier Free. Slug bersifat permanen
              dan tidak dapat diubah setelah dibuat.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((vals) => createMutation.mutate(vals))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="portal-ten-name">Nama Tenant</Label>
              <Input
                id="portal-ten-name"
                placeholder="Mis. PT Maju Bersama"
                {...form.register("name", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (!slugTouched) {
                      form.setValue("slug", slugifyTenantName(e.target.value));
                    }
                  },
                })}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portal-ten-slug">Slug Tenant (Immutable)</Label>
              <Input
                id="portal-ten-slug"
                placeholder="maju-bersama"
                className="font-mono text-sm"
                {...form.register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              <p className="text-[11px] text-muted-foreground">
                Digunakan sebagai namespace URL tenant Anda. Tidak dapat diubah
                di kemudian hari.
              </p>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
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
                {createMutation.isPending ? "Membuat..." : "Buat Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
