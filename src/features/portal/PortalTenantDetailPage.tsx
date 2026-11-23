import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  KeyRound,
  Lock,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type BillingRecord,
  type BillingRecordStatus,
  FREE_TIER_ID,
  FREE_TIER_MAX_OAUTH_CLIENTS,
  type PortalOAuthClientRecord,
  createTenantOAuthClient,
  deleteTenantOAuthClient,
  formatCurrency,
  getMyTenant,
  getMyTenantBilling,
  getTierLabel,
  listTenantOAuthClients,
  updateMyTenant,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  type CreatePortalOAuthClientValues,
  type UpdatePortalTenantValues,
  createPortalOAuthClientSchema,
  parseRedirectUris,
  updatePortalTenantSchema,
} from "@/features/portal/schema";
import {
  BillingRecordStatusBadge,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface PortalTenantDetailPageProps {
  tenantId: string;
}

export function PortalTenantDetailPage({
  tenantId,
}: PortalTenantDetailPageProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "settings" | "oauth-clients" | "billing"
  >("settings");
  const [oauthPaging, setOauthPaging] = useState({
    page: 0,
    pageSize: 10,
    search: "",
  });
  const [billingPaging, setBillingPaging] = useState<{
    page: number;
    pageSize: number;
    status: "all" | BillingRecordStatus;
  }>({
    page: 0,
    pageSize: 10,
    status: "all",
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
  });

  const oauthQuery = useQuery({
    queryKey: ["portal-tenant-oauth", tenantId, oauthPaging],
    queryFn: () =>
      listTenantOAuthClients(tenantId, {
        page: oauthPaging.page,
        pageSize: oauthPaging.pageSize,
        search: oauthPaging.search || undefined,
      }),
    enabled: activeTab === "oauth-clients",
  });

  const billingQuery = useQuery({
    queryKey: ["portal-tenant-billing", tenantId, billingPaging],
    queryFn: () =>
      getMyTenantBilling(tenantId, {
        page: billingPaging.page,
        pageSize: billingPaging.pageSize,
        status:
          billingPaging.status === "all" ? undefined : billingPaging.status,
      }),
    enabled: activeTab === "billing",
  });

  const tenantForm = useForm<UpdatePortalTenantValues>({
    resolver: zodResolver(updatePortalTenantSchema),
    defaultValues: {
      name: tenantQuery.data?.name ?? "",
    },
  });

  useEffect(() => {
    if (tenantQuery.data) {
      tenantForm.reset({ name: tenantQuery.data.name });
    }
  }, [tenantQuery.data, tenantForm]);

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

  const updateTenantMutation = useMutation({
    mutationFn: (vals: UpdatePortalTenantValues) =>
      updateMyTenant(tenantId, { name: vals.name }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant", tenantId],
      });
      void queryClient.invalidateQueries({ queryKey: ["portal-tenants"] });
      toast.success(`Nama tenant '${updated.name}' berhasil disimpan.`);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui nama tenant.",
      );
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
                await navigator.clipboard.writeText(row.original.clientId);
                toast.success("Client ID disalin.");
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
        </div>
      ),
    },
  ];

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

  if (tenantQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" color="secondary" size="sm" asChild>
          <Link to="/tenants">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Kembali ke Portal Tenant
          </Link>
        </Button>
        <Alert color="destructive" variant="soft">
          <AlertTitle className="text-sm">Tenant Tidak Dapat Dimuat</AlertTitle>
          <AlertDescription className="text-xs">
            {tenantQuery.error instanceof Error
              ? tenantQuery.error.message
              : "Tenant tidak ditemukan atau Anda tidak memiliki akses."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tenant = tenantQuery.data;
  const isFreeTier = tenant.tierId === FREE_TIER_ID;
  const oauthTotal = oauthQuery.data?.total ?? 0;
  const quotaReached = isFreeTier && oauthTotal >= FREE_TIER_MAX_OAUTH_CLIENTS;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" color="secondary" size="sm" asChild className="-ml-2 h-8 px-2">
            <Link to="/tenants">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Semua Tenant Saya
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-default-900">
              {tenant.name}
            </h1>
            <TenantStatusBadge status={tenant.status} />
            <TenantTierBadge tierId={tenant.tierId} />
            <TenantBillingStatusBadge status={tenant.billingStatus} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            slug: {tenant.slug} · id: {tenant.id} · config v{tenant.configVersion}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "settings" | "oauth-clients" | "billing")
        }
      >
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Pengaturan Tenant
          </TabsTrigger>
          <TabsTrigger value="oauth-clients">
            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
            OAuth 2.1 / MCP Clients
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Ringkasan Billing
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SETTINGS (with read-only immutable slug) */}
        <TabsContent value="settings" className="pt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Profil & Identitas Tenant
                </CardTitle>
                <CardDescription>
                  Perbarui nama tampilan tenant. Slug bersifat immutable dan
                  tidak dapat diubah.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={tenantForm.handleSubmit((vals) =>
                    updateTenantMutation.mutate(vals),
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="detail-ten-name">Nama Tenant</Label>
                    <Input
                      id="detail-ten-name"
                      {...tenantForm.register("name")}
                    />
                    {tenantForm.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {tenantForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="detail-ten-slug"
                      className="flex items-center gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Slug Tenant (Read-Only / Immutable)
                    </Label>
                    <Input
                      id="detail-ten-slug"
                      value={tenant.slug}
                      readOnly
                      disabled
                      className="bg-muted font-mono text-sm text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Slug tenant bersifat immutable setelah pembuatan untuk
                      menjaga konsistensi routing OIDC & callback URL.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      color="primary"
                      disabled={updateTenantMutation.isPending}
                    >
                      {updateTenantMutation.isPending
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Metadata Runtime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Tenant ID</span>
                  <span className="font-mono font-medium">{tenant.id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Tier Aktif</span>
                  <TenantTierBadge tierId={tenant.tierId} />
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Status Tenant</span>
                  <TenantStatusBadge status={tenant.status} />
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Status Billing</span>
                  <TenantBillingStatusBadge status={tenant.billingStatus} />
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Config Version</span>
                  <span className="tabular-nums font-semibold">
                    v{tenant.configVersion}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dibuat</span>
                  <span>{formatDate(tenant.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: OAUTH CLIENTS */}
        <TabsContent value="oauth-clients" className="space-y-4 pt-4">
          {isFreeTier && (
            <Alert color="info" variant="soft">
              <AlertTitle className="text-sm">
                Kuota Tier {getTierLabel(tenant.tierId)}
              </AlertTitle>
              <AlertDescription className="text-xs">
                Tier Free mengizinkan maksimal {FREE_TIER_MAX_OAUTH_CLIENTS}{" "}
                OAuth client per tenant (saat ini: {oauthTotal}/
                {FREE_TIER_MAX_OAUTH_CLIENTS}). Hubungi operator untuk upgrade
                ke Basic/Business jika membutuhkan multi-client.
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
                  Client secret untuk tipe confidential/MCP hanya ditampilkan
                  satu kali saat registrasi.
                </CardDescription>
              </div>
              <Button
                color="primary"
                disabled={quotaReached}
                onClick={() => setCreateClientOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Register Client
              </Button>
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
        </TabsContent>

        {/* TAB 3: BILLING SUMMARY */}
        <TabsContent value="billing" className="space-y-4 pt-4">
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
                <div className="text-xs text-muted-foreground">
                  Status Billing
                </div>
                <div className="mt-2">
                  <TenantBillingStatusBadge
                    status={
                      billingQuery.data?.billingStatus ?? tenant.billingStatus
                    }
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
        </TabsContent>
      </Tabs>

      {/* Register OAuth Client Dialog */}
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

      {/* One-time plainClientSecret Reveal Modal */}
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
                  await navigator.clipboard.writeText(
                    revealedSecret.plainClientSecret,
                  );
                  toast.success("Client secret disalin ke clipboard.");
                }
                setRevealedSecret(null);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Salin Secret & Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete OAuth Client Confirmation */}
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
              (<span className="font-mono">{deleteClientTarget?.clientId}</span>)
              akan dihapus permanen dan tidak lagi dapat melakukan autentikasi
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
