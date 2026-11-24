import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getMyTenant,
  updateMyTenant,
  type TenantRecord,
} from "@/api/tenant-service";
import { formatDate } from "@/lib/utils";
import {
  type UpdatePortalTenantValues,
  updatePortalTenantSchema,
} from "@/features/portal/schema";
import {
  TenantBillingStatusBadge,
  TenantStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function PortalTenantSettingsTab({
  tenantId,
  tenant: tenantProp,
}: {
  tenantId: string;
  tenant?: TenantRecord;
}) {
  const queryClient = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ["portal-tenant", tenantId],
    queryFn: () => getMyTenant(tenantId),
    enabled: !tenantProp,
  });

  const tenantForm = useForm<UpdatePortalTenantValues>({
    resolver: zodResolver(updatePortalTenantSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (tenantQuery.data) {
      tenantForm.reset({ name: tenantQuery.data.name });
    }
  }, [tenantQuery.data, tenantForm]);

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

  if (tenantQuery.isLoading && !tenantProp) {
    return <Skeleton className="h-72 w-full" />;
  }

  const tenant = tenantProp ?? tenantQuery.data;
  if (!tenant) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Profil & Identitas Tenant
          </CardTitle>
          <CardDescription>
            Perbarui nama tampilan tenant. Slug bersifat immutable dan tidak
            dapat diubah.
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
              <Input id="detail-ten-name" {...tenantForm.register("name")} />
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
                Slug tenant bersifat immutable setelah pembuatan untuk menjaga
                konsistensi routing OIDC & callback URL.
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
  );
}