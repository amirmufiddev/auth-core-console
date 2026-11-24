import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ShieldCheck, ShieldOff } from "lucide-react";
import {
  type PortalTenantUserRecord,
  listTenantUsers,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { OwnerOnly } from "@/components/layout/Can";

export { OwnerOnly };

interface PortalTenantUsersTabProps {
  tenantId: string;
  tenantSlug: string;
}

export function PortalTenantUsersTab({
  tenantId,
  tenantSlug,
}: PortalTenantUsersTabProps) {
  const [paging, setPaging] = useState({
    page: 0,
    pageSize: 10,
    search: "",
  });

  const usersQuery = useQuery({
    queryKey: ["portal-tenant-users", tenantId, paging],
    queryFn: () =>
      listTenantUsers(tenantId, {
        page: paging.page,
        pageSize: paging.pageSize,
        search: paging.search || undefined,
      }),
  });

  const columns: ColumnDef<PortalTenantUserRecord>[] = [
    {
      accessorKey: "name",
      header: "Pengguna",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-default-900">
            {row.original.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.email}
          </div>
          {row.original.username && (
            <div className="font-mono text-[11px] text-muted-foreground">
              @{row.original.username}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Peran",
      cell: ({ row }) => (
        <Badge color="secondary" variant="soft" className="text-xs">
          {row.original.role || "Pengguna tenant"}
        </Badge>
      ),
    },
    {
      accessorKey: "emailVerified",
      header: "Verifikasi",
      cell: ({ row }) => (
        <Badge
          color={row.original.emailVerified ? "success" : "warning"}
          variant="soft"
          className="text-xs"
        >
          {row.original.emailVerified ? "Terverifikasi" : "Belum Verifikasi"}
        </Badge>
      ),
    },
    {
      accessorKey: "twoFactorEnabled",
      header: "2FA",
      cell: ({ row }) =>
        row.original.twoFactorEnabled ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldOff className="h-3.5 w-3.5" />
            Nonaktif
          </span>
        ),
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          color={row.original.banned ? "destructive" : "success"}
          variant="outline"
          className="text-xs"
        >
          {row.original.banned ? "Banned" : "Aktif"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Terdaftar",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {usersQuery.isError && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">Gagal Memuat Daftar User</AlertTitle>
          <AlertDescription className="text-xs">
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : "Terjadi kesalahan saat mengambil daftar user tenant."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="mb-0">
          <CardTitle className="text-base font-semibold">
            Daftar User Tenant
          </CardTitle>
          <CardDescription>
            Pengguna yang terdaftar dan terisolasi khusus pada tenant{" "}
            <span className="font-mono font-medium">{tenantSlug}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={usersQuery.data?.items ?? []}
            totalCount={usersQuery.data?.total ?? 0}
            pageIndex={paging.page}
            pageSize={paging.pageSize}
            onPaginationChange={(next) =>
              setPaging((prev) => ({
                ...prev,
                page: next.pageIndex,
                pageSize: next.pageSize,
              }))
            }
            searchValue={paging.search}
            onSearchChange={(val) =>
              setPaging((prev) => ({ ...prev, search: val, page: 0 }))
            }
            searchPlaceholder="Cari nama, email, atau username..."
            isLoading={usersQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
