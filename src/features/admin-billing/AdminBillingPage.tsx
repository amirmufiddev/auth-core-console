import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type BillingRecord,
  TENANT_TIER_OPTIONS,
  adminCreateBillingRecord,
  adminListBillingRecords,
  adminListTenants,
  formatCurrency,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  type AdminBillingSearchParams,
  type AdminCreateBillingValues,
  adminCreateBillingSchema,
} from "@/features/admin-billing/schema";
import {
  BillingRecordStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Textarea } from "@/components/ui/textarea";

interface AdminBillingPageProps {
  searchParams: AdminBillingSearchParams;
  onUpdateSearch: (patch: Partial<AdminBillingSearchParams>) => void;
}

function defaultPeriodDates(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 86400000);
  return { start, end };
}

export function AdminBillingPage({
  searchParams,
  onUpdateSearch,
}: AdminBillingPageProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const billingQuery = useQuery({
    queryKey: ["admin-billing", searchParams],
    queryFn: () =>
      adminListBillingRecords({
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        tenantId: searchParams.tenantId || undefined,
        tierId: searchParams.tierId === "all" ? undefined : searchParams.tierId,
        status: searchParams.status === "all" ? undefined : searchParams.status,
      }),
  });

  const tenantsLookupQuery = useQuery({
    queryKey: ["admin-tenants-lookup"],
    queryFn: () => adminListTenants({ page: 0, pageSize: 100 }),
  });

  const tenantMap = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; tierId: string }>();
    for (const t of tenantsLookupQuery.data?.items ?? []) {
      map.set(t.id, { name: t.name, slug: t.slug, tierId: t.tierId });
    }
    return map;
  }, [tenantsLookupQuery.data?.items]);

  const initialDates = defaultPeriodDates();
  const form = useForm<AdminCreateBillingValues>({
    resolver: zodResolver(adminCreateBillingSchema),
    defaultValues: {
      tenantId: searchParams.tenantId || "",
      tierId: "tier_business",
      status: "paid",
      amount: 499000,
      currency: "IDR",
      periodStart: initialDates.start,
      periodEnd: initialDates.end,
      note: "",
      tenantBillingStatus: "auto",
    },
  });

  const createMutation = useMutation({
    mutationFn: (vals: AdminCreateBillingValues) =>
      adminCreateBillingRecord({
        tenantId: vals.tenantId,
        tierId: vals.tierId,
        status: vals.status,
        amount: vals.amount,
        currency: vals.currency,
        periodStart: vals.periodStart.toISOString(),
        periodEnd: vals.periodEnd.toISOString(),
        note: vals.note?.trim() ? vals.note.trim() : undefined,
        tenantBillingStatus:
          vals.tenantBillingStatus === "auto"
            ? undefined
            : vals.tenantBillingStatus,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-billing"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Transaksi billing berhasil dicatat ke ledger.");
      setCreateOpen(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mencatat billing record.",
      );
    },
  });

  const openCreateDialog = () => {
    const dates = defaultPeriodDates();
    const firstTenant =
      (searchParams.tenantId
        ? tenantsLookupQuery.data?.items.find(
            (t) => t.id === searchParams.tenantId,
          )
        : undefined) ?? tenantsLookupQuery.data?.items[0];
    form.reset({
      tenantId: firstTenant?.id ?? searchParams.tenantId ?? "",
      tierId: firstTenant?.tierId ?? "tier_business",
      status: "paid",
      amount: 499000,
      currency: "IDR",
      periodStart: dates.start,
      periodEnd: dates.end,
      note: "",
      tenantBillingStatus: "auto",
    });
    setCreateOpen(true);
  };

  const records = billingQuery.data?.items ?? [];
  const total = billingQuery.data?.total ?? 0;
  const nonVoidRecords = records.filter((r) => r.status !== "void");
  const pageAmountSum = nonVoidRecords.reduce((sum, r) => sum + r.amount, 0);
  const currencies = new Set(
    nonVoidRecords.map((r) => r.currency).filter(Boolean),
  );
  const pageAmountDisplay =
    nonVoidRecords.length === 0
      ? formatCurrency(0, "IDR")
      : currencies.size === 1
        ? formatCurrency(pageAmountSum, Array.from(currencies)[0])
        : `Campuran (${Array.from(currencies).join("/")})`;
  const settledCount = records.filter(
    (r) => r.status === "paid" || r.status === "active",
  ).length;
  const attentionCount = records.filter(
    (r) => r.status === "past_due" || r.status === "manual_invoice",
  ).length;

  const columns: ColumnDef<BillingRecord>[] = [
    {
      accessorKey: "createdAt",
      header: "Tanggal & ID",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-default-900">
            {formatDate(row.original.createdAt)}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.id}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tenantId",
      header: "Tenant",
      cell: ({ row }) => {
        const meta = tenantMap.get(row.original.tenantId);
        return (
          <div>
            <div className="font-semibold text-default-900">
              {meta?.name ?? row.original.tenantId}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {meta ? `${meta.slug} · ${row.original.tenantId}` : row.original.tenantId}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "tierId",
      header: "Tier",
      cell: ({ row }) => <TenantTierBadge tierId={row.original.tierId} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <BillingRecordStatusBadge status={row.original.status} />
      ),
    },
    {
      accessorKey: "amount",
      header: "Nominal",
      cell: ({ row }) => (
        <span className="tabular-nums font-semibold text-default-900">
          {formatCurrency(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "periodStart",
      header: "Periode",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.periodStart)} –{" "}
          {formatDate(row.original.periodEnd)}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Catatan & Operator",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="truncate text-xs text-default-800">
            {row.original.note || "—"}
          </div>
          {row.original.recordedBy && (
            <div className="font-mono text-[11px] text-muted-foreground">
              by {row.original.recordedBy}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Operator Billing Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat transaksi langganan tenant, invoice manual, dan sinkronkan
            status billing tenant.
          </p>
        </div>
        <Button color="primary" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Billing
        </Button>
      </div>

      {billingQuery.isError && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">
            Gagal Memuat Riwayat Billing
          </AlertTitle>
          <AlertDescription className="text-xs">
            {(billingQuery.error as Error)?.message ?? "Gagal memuat data"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Catatan Ledger</span>
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Nominal (Halaman)</span>
              <Wallet className="h-4 w-4 text-info" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {pageAmountDisplay}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Paid / Active (Halaman)</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {settledCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Past Due / Manual (Halaman)</span>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {attentionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4 text-primary" />
            Riwayat Transaksi Billing
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={searchParams.tenantId || "all"}
              onValueChange={(val) =>
                onUpdateSearch({ tenantId: val === "all" ? "" : val, page: 0 })
              }
            >
              <SelectTrigger className="h-9 w-48" size="sm">
                <SelectValue placeholder="Filter Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tenant</SelectItem>
                {(tenantsLookupQuery.data?.items ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={searchParams.tierId}
              onValueChange={(val) => onUpdateSearch({ tierId: val, page: 0 })}
            >
              <SelectTrigger className="h-9 w-36" size="sm">
                <SelectValue placeholder="Tier" />
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

            <Select
              value={searchParams.status}
              onValueChange={(val) =>
                onUpdateSearch({
                  status: val as AdminBillingSearchParams["status"],
                  page: 0,
                })
              }
            >
              <SelectTrigger className="h-9 w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="manual_invoice">Manual Invoice</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={records}
            totalCount={total}
            pageIndex={searchParams.page}
            pageSize={searchParams.pageSize}
            onPaginationChange={(next) =>
              onUpdateSearch({ page: next.pageIndex, pageSize: next.pageSize })
            }
            isLoading={billingQuery.isLoading}
          />
        </CardContent>
      </Card>

      {/* Record Billing Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Catat Transaksi Billing</DialogTitle>
            <DialogDescription>
              Mencatat transaksi baru ke ledger dan menyinkronkan{" "}
              <code className="text-xs">billingStatus</code> tenant.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((vals) => createMutation.mutate(vals))}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tenant</Label>
                <Controller
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        const meta = tenantMap.get(val);
                        if (meta) {
                          form.setValue("tierId", meta.tierId);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tenantsLookupQuery.data?.items ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.tenantId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.tenantId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Controller
                  control={form.control}
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status Record</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="manual_invoice">
                          Manual Invoice
                        </SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Sinkronkan Tenant Billing Status</Label>
                <Controller
                  control={form.control}
                  name="tenantBillingStatus"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          Otomatis sesuai status record
                        </SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="manual_invoice">
                          Manual Invoice
                        </SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bill-amount">Nominal (Bilangan Bulat)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  min={0}
                  {...form.register("amount", { valueAsNumber: true })}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bill-currency">Mata Uang</Label>
                <Input
                  id="bill-currency"
                  placeholder="IDR"
                  {...form.register("currency")}
                />
                {form.formState.errors.currency && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.currency.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Awal Periode</Label>
                <Controller
                  control={form.control}
                  name="periodStart"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih tanggal mulai"
                    />
                  )}
                />
                {form.formState.errors.periodStart && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.periodStart.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Akhir Periode</Label>
                <Controller
                  control={form.control}
                  name="periodEnd"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih tanggal akhir"
                    />
                  )}
                />
                {form.formState.errors.periodEnd && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.periodEnd.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill-note">Catatan (Opsional)</Label>
              <Textarea
                id="bill-note"
                rows={2}
                placeholder="Mis. Pembayaran invoice manual via transfer bank"
                {...form.register("note")}
              />
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
                {createMutation.isPending ? "Menyimpan..." : "Simpan Ledger"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
