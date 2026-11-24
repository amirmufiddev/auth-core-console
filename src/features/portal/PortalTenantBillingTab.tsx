import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  type BillingRecord,
  type BillingRecordStatus,
  type TenantRecord,
  formatCurrency,
  getMyTenant,
  getMyTenantBilling,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  BillingRecordStatusBadge,
  TenantBillingStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PortalTenantBillingTab({
  tenantId,
  tenant: tenantProp,
}: {
  tenantId: string;
  tenant?: TenantRecord;
}) {
  const [billingPaging, setBillingPaging] = useState<{
    page: number;
    pageSize: number;
    status: "all" | BillingRecordStatus;
  }>({
    page: 0,
    pageSize: 10,
    status: "all",
  });

  const tenantQuery = useQuery({
    queryKey: ["portal-tenant", tenantId],
    queryFn: () => getMyTenant(tenantId),
    enabled: !tenantProp,
  });

  const tenant = tenantProp ?? tenantQuery.data;

  const billingQuery = useQuery({
    queryKey: ["portal-tenant-billing", tenantId, billingPaging],
    queryFn: () =>
      getMyTenantBilling(tenantId, {
        page: billingPaging.page,
        pageSize: billingPaging.pageSize,
        status:
          billingPaging.status === "all" ? undefined : billingPaging.status,
      }),
    enabled: Boolean(tenant),
  });

  const billingColumns: ColumnDef<BillingRecord>[] = [
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-xs text-default-800">
          {formatDate(row.original.createdAt)}
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
      header: "Catatan",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.note || "—"}
        </span>
      ),
    },
  ];

  if (!tenant) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Tier Saat Ini</div>
            <div className="mt-2">
              <TenantTierBadge
                tierId={billingQuery.data?.tierId ?? tenant.tierId}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Status Billing</div>
            <div className="mt-2">
              <TenantBillingStatusBadge
                status={billingQuery.data?.billingStatus ?? tenant.billingStatus}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">
              Total Catatan Invoice
            </div>
            <div className="mt-2 text-2xl font-bold text-default-900">
              {billingQuery.data?.total ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Riwayat Billing Tenant
          </CardTitle>
          <Select
            value={billingPaging.status}
            onValueChange={(val) =>
              setBillingPaging((prev) => ({
                ...prev,
                status: val as "all" | BillingRecordStatus,
                page: 0,
              }))
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
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={billingColumns}
            data={billingQuery.data?.items ?? []}
            totalCount={billingQuery.data?.total ?? 0}
            pageIndex={billingPaging.page}
            pageSize={billingPaging.pageSize}
            onPaginationChange={(next) =>
              setBillingPaging((prev) => ({
                ...prev,
                page: next.pageIndex,
                pageSize: next.pageSize,
              }))
            }
            isLoading={billingQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}