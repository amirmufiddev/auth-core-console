import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Copy, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type PortalTenantApiKeyRecord,
  createTenantApiKey,
  deleteTenantApiKey,
  listTenantApiKeys,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  type CreatePortalApiKeyValues,
  createPortalApiKeySchema,
} from "@/features/portal/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
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

interface PortalTenantApiKeysTabProps {
  tenantId: string;
  tierId: string;
}

const TIER_WITH_API_KEY = new Set(["tier_basic", "tier_business", "tier_enterprise"]);

export function PortalTenantApiKeysTab({
  tenantId,
  tierId,
}: PortalTenantApiKeysTabProps) {
  const queryClient = useQueryClient();
  const tierAllowsApiKey = TIER_WITH_API_KEY.has(tierId);

  const [paging, setPaging] = useState({
    page: 0,
    pageSize: 10,
    search: "",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [revealKey, setRevealKey] = useState<PortalTenantApiKeyRecord | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] =
    useState<PortalTenantApiKeyRecord | null>(null);

  const apiKeysQuery = useQuery({
    queryKey: ["portal-tenant-api-keys", tenantId, paging],
    queryFn: () =>
      listTenantApiKeys(tenantId, {
        page: paging.page,
        pageSize: paging.pageSize,
        search: paging.search || undefined,
      }),
    retry: tierAllowsApiKey,
  });

  const createForm = useForm<CreatePortalApiKeyValues>({
    resolver: zodResolver(createPortalApiKeySchema),
    defaultValues: {
      name: "",
      scopesText: "sessions:verify",
      rateLimitMax: 100,
    },
  });

  const createMutation = useMutation({
    mutationFn: (vals: CreatePortalApiKeyValues) =>
      createTenantApiKey(tenantId, {
        name: vals.name,
        scopes: vals.scopesText
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        rateLimitMax: vals.rateLimitMax,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-api-keys", tenantId],
      });
      setCreateOpen(false);
      createForm.reset();
      setRevealKey(created);
      toast.success("Tenant API Key berhasil dibuat.");
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat Tenant API Key.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => deleteTenantApiKey(tenantId, keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-api-keys", tenantId],
      });
      setDeleteTarget(null);
      toast.success("API Key tenant dicabut.");
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mencabut API Key.",
      );
    },
  });

  const columns: ColumnDef<PortalTenantApiKeyRecord>[] = [
    {
      accessorKey: "name",
      header: "Nama Key",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-default-900">
            {row.original.name}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.keyPreview}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "scopes",
      header: "Scopes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.scopes.map((scope) => (
            <Badge
              key={scope}
              color="secondary"
              variant="soft"
              className="text-[10px]"
            >
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "rateLimitMax",
      header: "Rate Limit",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {row.original.rateLimitMax}/{row.original.rateLimitWindow}s
        </span>
      ),
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          color={row.original.enabled ? "success" : "warning"}
          variant="soft"
        >
          {row.original.enabled ? "Aktif" : "Nonaktif"}
        </Badge>
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
          <Button
            type="button"
            size="icon"
            variant="ghost"
            color="destructive"
            className="h-8 w-8"
            onClick={() => setDeleteTarget(row.original)}
            aria-label="Cabut API Key"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {!tierAllowsApiKey && (
        <Alert color="warning" variant="soft">
          <AlertTitle className="text-sm">Fitur API Key tidak tersedia</AlertTitle>
          <AlertDescription className="text-xs">
            Tier Free tidak menyertakan plugin API Key. Upgrade ke Basic/Business
            melalui operator, lalu aktifkan fitur <strong>API Keys</strong> di tab
            IAM Features jika diperlukan.
          </AlertDescription>
        </Alert>
      )}

      {apiKeysQuery.isError && tierAllowsApiKey && (
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">Gagal memuat API Key</AlertTitle>
          <AlertDescription className="text-xs">
            {apiKeysQuery.error instanceof Error
              ? apiKeysQuery.error.message
              : "Pastikan fitur apiKey aktif pada tier tenant."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Tenant API Keys (M2M / POS)
            </CardTitle>
            <CardDescription>
              Kunci untuk integrasi backend (mis. POS) via header{" "}
              <code className="text-xs">x-api-key</code> pada endpoint{" "}
              <code className="text-xs">/api/context/*</code>. Plain key hanya
              ditampilkan sekali saat dibuat.
            </CardDescription>
          </div>
          <Button
            color="primary"
            disabled={!tierAllowsApiKey}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat API Key
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={apiKeysQuery.data?.items ?? []}
            totalCount={apiKeysQuery.data?.total ?? 0}
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
            searchPlaceholder="Cari nama atau prefix..."
            isLoading={apiKeysQuery.isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Tenant API Key</DialogTitle>
            <DialogDescription>
              Key akan terikat ke tenant ini dan dapat digunakan untuk
              memverifikasi sesi real-time di POS.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit((vals) =>
              createMutation.mutate(vals),
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor="api-key-name">Nama</Label>
              <Input id="api-key-name" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-key-scopes">Scopes (pisahkan spasi/koma)</Label>
              <Textarea
                id="api-key-scopes"
                rows={2}
                {...createForm.register("scopesText")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-key-rate">Rate limit (req / menit)</Label>
              <Input
                id="api-key-rate"
                type="number"
                {...createForm.register("rateLimitMax", { valueAsNumber: true })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Membuat..." : "Buat Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(revealKey?.plainApiKey)}
        onOpenChange={(open) => !open && setRevealKey(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Simpan API Key Sekarang
            </DialogTitle>
            <DialogDescription>
              Salin dan simpan di vault aman. Key ini tidak akan ditampilkan lagi.
            </DialogDescription>
          </DialogHeader>
          {revealKey?.plainApiKey && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted p-3 font-mono text-xs break-all">
                {revealKey.plainApiKey}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(revealKey.plainApiKey!);
                    toast.success("API Key disalin.");
                  } catch {
                    toast.error("Gagal menyalin ke clipboard.");
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Salin ke Clipboard
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setRevealKey(null)}>
              Saya Sudah Menyimpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Key <strong>{deleteTarget?.name}</strong> akan dihapus permanen.
              Integrasi yang masih memakai key ini akan gagal autentikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Cabut Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}