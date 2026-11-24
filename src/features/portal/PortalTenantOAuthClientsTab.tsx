import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Copy, Plus, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  FREE_TIER_ID,
  FREE_TIER_MAX_OAUTH_CLIENTS,
  type PortalOAuthClientRecord,
  createTenantOAuthClient,
  deleteTenantOAuthClient,
  getMyTenant,
  getTierLabel,
  type TenantRecord,
  listTenantOAuthClients,
} from "@/api/tenant-service";
import {
  type CreatePortalOAuthClientValues,
  createPortalOAuthClientSchema,
  parseRedirectUris,
} from "@/features/portal/schema";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function PortalTenantOAuthClientsTab({
  tenantId,
  tenant: tenantProp,
}: {
  tenantId: string;
  tenant?: TenantRecord;
}) {
  const queryClient = useQueryClient();

  const [oauthPaging, setOauthPaging] = useState({
    page: 0,
    pageSize: 10,
    search: "",
  });

  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [deleteClientTarget, setDeleteClientTarget] =
    useState<PortalOAuthClientRecord | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<{
    clientId: string;
    clientName: string;
    plainClientSecret: string;
  } | null>(null);

  const tenantQuery = useQuery({
    queryKey: ["portal-tenant", tenantId],
    queryFn: () => getMyTenant(tenantId),
    enabled: !tenantProp,
  });

  const oauthQuery = useQuery({
    queryKey: ["portal-tenant-oauth", tenantId, oauthPaging],
    queryFn: () =>
      listTenantOAuthClients(tenantId, {
        page: oauthPaging.page,
        pageSize: oauthPaging.pageSize,
        search: oauthPaging.search || undefined,
      }),
  });

  const oauthQuotaQuery = useQuery({
    queryKey: ["portal-tenant-oauth-quota", tenantId],
    queryFn: () =>
      listTenantOAuthClients(tenantId, {
        page: 0,
        pageSize: 1,
      }),
    enabled: (tenantProp ?? tenantQuery.data)?.tierId === FREE_TIER_ID,
  });

  const oauthForm = useForm<CreatePortalOAuthClientValues>({
    resolver: zodResolver(createPortalOAuthClientSchema),
    defaultValues: {
      name: "",
      type: "oidc-confidential",
      redirectUrisText: "https://app.example.com/callback",
      scopesText: "openid profile email",
      pkceRequired: true,
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (vals: CreatePortalOAuthClientValues) =>
      createTenantOAuthClient(tenantId, {
        name: vals.name,
        type: vals.type,
        redirectUris: parseRedirectUris(vals.redirectUrisText),
        scopes: vals.scopesText.split(/[\s,]+/).filter(Boolean),
        pkceRequired: vals.pkceRequired,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-oauth", tenantId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-oauth-quota", tenantId],
      });
      setCreateClientOpen(false);
      oauthForm.reset({
        name: "",
        type: "oidc-confidential",
        redirectUrisText: "https://app.example.com/callback",
        scopesText: "openid profile email",
        pkceRequired: true,
      });
      if (created.plainClientSecret) {
        setRevealedSecret({
          clientId: created.clientId,
          clientName: created.name,
          plainClientSecret: created.plainClientSecret,
        });
      }
      toast.success(`OAuth client '${created.name}' berhasil didaftarkan.`);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan OAuth client.",
      );
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) =>
      deleteTenantOAuthClient(tenantId, clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-oauth", tenantId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant-oauth-quota", tenantId],
      });
      setDeleteClientTarget(null);
      toast.success("OAuth client berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus OAuth client.",
      );
    },
  });

  const oauthColumns: ColumnDef<PortalOAuthClientRecord>[] = [
    {
      accessorKey: "name",
      header: "Aplikasi Klien",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-default-900">
            {row.original.name}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span>{row.original.clientId}</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(row.original.clientId);
                  toast.success("Client ID disalin.");
                } catch {
                  toast.error("Gagal menyalin Client ID ke clipboard.");
                }
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Salin Client ID"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => (
        <Badge
          color={row.original.type === "mcp-client" ? "info" : "default"}
          variant="soft"
          className="text-xs"
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "redirectUris",
      header: "Redirect URIs",
      cell: ({ row }) => (
        <div className="max-w-xs space-y-0.5 font-mono text-xs text-muted-foreground">
          {row.original.redirectUris.map((uri) => (
            <div key={uri} className="truncate">
              {uri}
            </div>
          ))}
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
      accessorKey: "pkceRequired",
      header: "PKCE",
      cell: ({ row }) => (
        <Badge
          color={row.original.pkceRequired ? "success" : "warning"}
          variant="outline"
        >
          {row.original.pkceRequired ? "Enforced" : "Optional"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <OwnerOnly>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              color="destructive"
              className="h-8 w-8"
              onClick={() => setDeleteClientTarget(row.original)}
              aria-label="Hapus OAuth client"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </OwnerOnly>
        </div>
      ),
    },
  ];

  const tenant = tenantProp ?? tenantQuery.data;
  if (!tenant) return null;

  const isFreeTier = tenant.tierId === FREE_TIER_ID;
  const oauthTotal = oauthQuery.data?.total ?? 0;
  const quotaLoading = isFreeTier && oauthQuotaQuery.isLoading;
  const unfilteredOAuthTotal = isFreeTier
    ? (oauthQuotaQuery.data?.total ?? (oauthPaging.search ? 0 : oauthTotal))
    : oauthTotal;
  const quotaReached =
    isFreeTier &&
    (quotaLoading || unfilteredOAuthTotal >= FREE_TIER_MAX_OAUTH_CLIENTS);

  return (
  <div className="space-y-4">
      {isFreeTier && (
        <Alert color="info" variant="soft">
          <AlertTitle className="text-sm">
            Kuota Tier {getTierLabel(tenant.tierId)}
          </AlertTitle>
          <AlertDescription className="text-xs">
            Tier Free mengizinkan maksimal {FREE_TIER_MAX_OAUTH_CLIENTS} OAuth
            client per tenant (saat ini:{" "}
            {quotaLoading ? "..." : unfilteredOAuthTotal}/
            {FREE_TIER_MAX_OAUTH_CLIENTS}). Hubungi operator untuk upgrade ke
            Basic/Business jika membutuhkan multi-client.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              OAuth 2.1 / OIDC & MCP Clients
            </CardTitle>
            <CardDescription>
              Client secret untuk tipe confidential/MCP hanya ditampilkan satu
              kali saat registrasi.
            </CardDescription>
          </div>
          <OwnerOnly>
            <Button
              color="primary"
              disabled={quotaReached}
              onClick={() => setCreateClientOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Register Client
            </Button>
          </OwnerOnly>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={oauthColumns}
            data={oauthQuery.data?.items ?? []}
            totalCount={oauthTotal}
            pageIndex={oauthPaging.page}
            pageSize={oauthPaging.pageSize}
            onPaginationChange={(next) =>
              setOauthPaging((prev) => ({
                ...prev,
                page: next.pageIndex,
                pageSize: next.pageSize,
              }))
            }
            searchValue={oauthPaging.search}
            onSearchChange={(val) =>
              setOauthPaging((prev) => ({ ...prev, search: val, page: 0 }))
            }
            searchPlaceholder="Cari nama atau clientId..."
            isLoading={oauthQuery.isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={createClientOpen} onOpenChange={setCreateClientOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Register OAuth 2.1 / MCP Client</DialogTitle>
            <DialogDescription>
              Daftarkan aplikasi klien terikat tenant{" "}
              <span className="font-mono font-medium">{tenant.slug}</span>.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={oauthForm.handleSubmit((vals) =>
              createClientMutation.mutate(vals),
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="portal-oa-name">Nama Aplikasi</Label>
              <Input
                id="portal-oa-name"
                placeholder="Mis. Acme Web App"
                {...oauthForm.register("name")}
              />
              {oauthForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {oauthForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipe Client</Label>
              <Controller
                control={oauthForm.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oidc-confidential">
                        oidc-confidential (Web / Backend dengan secret)
                      </SelectItem>
                      <SelectItem value="oidc-public">
                        oidc-public (SPA / Mobile tanpa secret)
                      </SelectItem>
                      <SelectItem value="mcp-client">
                        mcp-client (AI Agent / MCP dengan secret)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portal-oa-redirects">
                Redirect URIs (pisahkan baris baru atau koma)
              </Label>
              <Textarea
                id="portal-oa-redirects"
                rows={2}
                className="font-mono text-xs"
                {...oauthForm.register("redirectUrisText")}
              />
              {oauthForm.formState.errors.redirectUrisText && (
                <p className="text-xs text-destructive">
                  {oauthForm.formState.errors.redirectUrisText.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="portal-oa-scopes">Scopes</Label>
              <Input
                id="portal-oa-scopes"
                className="font-mono text-xs"
                {...oauthForm.register("scopesText")}
              />
              {oauthForm.formState.errors.scopesText && (
                <p className="text-xs text-destructive">
                  {oauthForm.formState.errors.scopesText.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
              <div>
                <Label htmlFor="portal-oa-pkce" className="cursor-pointer">
                  Wajibkan PKCE (S256)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Direkomendasikan aktif untuk seluruh aliran OAuth 2.1.
                </p>
              </div>
              <Controller
                control={oauthForm.control}
                name="pkceRequired"
                render={({ field }) => (
                  <Switch
                    id="portal-oa-pkce"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => setCreateClientOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending
                  ? "Mendaftarkan..."
                  : "Register Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(revealedSecret)}
        onOpenChange={(open) => !open && setRevealedSecret(null)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Simpan Client Secret Anda Sekarang
            </DialogTitle>
            <DialogDescription>
              Client secret untuk{" "}
              <span className="font-medium text-foreground">
                {revealedSecret?.clientName}
              </span>{" "}
              hanya ditampilkan satu kali dan tidak dapat dilihat lagi setelah
              dialog ini ditutup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/40 p-2.5 text-xs">
              <div className="text-muted-foreground">Client ID</div>
              <div className="mt-0.5 font-mono font-medium text-foreground">
                {revealedSecret?.clientId}
              </div>
            </div>
            <Alert color="warning">
              <AlertTitle className="text-sm">
                Client Secret (One-Time Reveal)
              </AlertTitle>
              <AlertDescription className="mt-1 break-all font-mono text-xs">
                {revealedSecret?.plainClientSecret}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              color="secondary"
              onClick={() => setRevealedSecret(null)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              color="primary"
              onClick={async () => {
                if (revealedSecret) {
                  try {
                    await navigator.clipboard.writeText(
                      revealedSecret.plainClientSecret,
                    );
                    toast.success("Client secret disalin ke clipboard.");
                    setRevealedSecret(null);
                  } catch {
                    toast.error(
                      "Gagal menyalin secret ke clipboard. Salin secret secara manual sebelum menutup.",
                    );
                  }
                } else {
                  setRevealedSecret(null);
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Salin Secret & Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteClientTarget)}
        onOpenChange={(open) => !open && setDeleteClientTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus OAuth Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Aplikasi klien{" "}
              <span className="font-semibold text-foreground">
                {deleteClientTarget?.name}
              </span>{" "}
              (<span className="font-mono">{deleteClientTarget?.clientId}</span>
              ) akan dihapus permanen dan tidak lagi dapat melakukan autentikasi
              OIDC/OAuth.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel color="secondary" variant="outline">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              color="destructive"
              disabled={deleteClientMutation.isPending}
              onClick={() => {
                if (deleteClientTarget) {
                  deleteClientMutation.mutate(deleteClientTarget.id);
                }
              }}
            >
              Ya, Hapus Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  </div>
  );
}