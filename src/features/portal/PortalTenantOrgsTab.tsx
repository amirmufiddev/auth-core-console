import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import {
  type PortalTenantOrgRecord,
  listTenantOrganizations,
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

interface PortalTenantOrgsTabProps {
  tenantId: string;
  tenantSlug: string;
}

export function PortalTenantOrgsTab({
  tenantId,
  tenantSlug,
}: PortalTenantOrgsTabProps) {
  const [paging, setPaging] = useState({
    page: 0,
    pageSize: 10,
    search: "",
  });

  const orgsQuery = useQuery({
    queryKey: ["portal-tenant-orgs", tenantId, paging],
    queryFn: () =>
      listTenantOrganizations(tenantId, {
        page: paging.page,
        pageSize: paging.pageSize,
        search: paging.search || undefined,
      }),
  });

  const columns: ColumnDef<PortalTenantOrgRecord>[] = [
    {
      accessorKey: "name",
      header: "Organisasi / Workspace",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          {row.original.logo ? (
            <img
              src={row.original.logo}
              alt={row.original.name}
              className="h-8 w-8 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
              <Building2 className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="font-semibold text-default-900">
              {row.original.name}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {row.original.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) =>
        row.original.slug ? (
          <Badge color="secondary" variant="soft" className="font-mono text-xs">
            {row.original.slug}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
  ];

  return (
    <div className="space-y-4">
      {orgsQuery.isError && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">
            Gagal Memuat Daftar Organisasi
          </AlertTitle>
          <AlertDescription className="text-xs">
            {orgsQuery.error instanceof Error
              ? orgsQuery.error.message
              : "Terjadi kesalahan saat mengambil daftar organisasi tenant."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="mb-0">
          <CardTitle className="text-base font-semibold">
            Daftar Organisasi Tenant
          </CardTitle>
          <CardDescription>
            Workspace / organisasi yang terdaftar dan terisolasi pada tenant{" "}
            <span className="font-mono font-medium">{tenantSlug}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={orgsQuery.data?.items ?? []}
            totalCount={orgsQuery.data?.total ?? 0}
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
            searchPlaceholder="Cari nama atau slug organisasi..."
            isLoading={orgsQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
