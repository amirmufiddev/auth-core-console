import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CreditCard, ScrollText, UserCog } from "lucide-react";
import { adminListTenants } from "@/api/tenant-service";
import { canPlatform, type ActorRoleGrant } from "@/lib/console-shell";
import {
  TenantBillingStatusBadge,
  TenantStatusBadge,
  TenantTierBadge,
} from "@/features/portal/TenantBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlatformHomePage({ roles }: { roles: ActorRoleGrant[] }) {
  const canReadTenants = canPlatform(roles, "organization", "read");
  const canReadUsers = canPlatform(roles, "user", "read");
  const canReadAudit = canPlatform(roles, "auditLog", "read");
  const canConfigure = canPlatform(roles, "authConfig", "configure");

  const recentQuery = useQuery({
    queryKey: ["platform-home", "recent"],
    queryFn: () => adminListTenants({ page: 0, pageSize: 5 }),
    enabled: canReadTenants,
  });
  const suspendedQuery = useQuery({
    queryKey: ["platform-home", "suspended"],
    queryFn: () =>
      adminListTenants({ page: 0, pageSize: 1, status: "suspended" }),
    enabled: canReadTenants,
  });

  const recent = recentQuery.data?.items ?? [];
  const total = recentQuery.data?.total ?? 0;
  const suspended = suspendedQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Meja operator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenant pelanggan, status tagihan, dan staf platform. Plugin login
            diatur di Auth Features.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReadTenants && (
            <Button color="primary" asChild>
              <Link to="/platform/tenants">
                Direktori tenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          {canConfigure && (
            <Button variant="outline" asChild>
              <Link to="/platform/auth-features">Auth Features</Link>
            </Button>
          )}
        </div>
      </div>

      {canReadTenants ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground">Tenant</div>
                <div className="mt-2 text-2xl font-bold tabular-nums text-default-900">
                  {recentQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    total
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground">Ditangguhkan</div>
                <div className="mt-2 text-2xl font-bold tabular-nums text-default-900">
                  {suspendedQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    suspended
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex h-full flex-col justify-between gap-3 pt-6">
                <div className="text-xs text-muted-foreground">
                  Ledger tagihan
                </div>
                <Button variant="outline" className="w-fit" asChild>
                  <Link to="/platform/billing">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buka ledger
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {recentQuery.isError && (
            <Alert color="destructive" variant="soft">
              <AlertTitle className="text-sm">Gagal memuat tenant</AlertTitle>
              <AlertDescription className="text-xs">
                {recentQuery.error instanceof Error
                  ? recentQuery.error.message
                  : "Direktori tenant tidak dapat dibaca."}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="mb-0">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="h-4 w-4" />
                Tenant terbaru
              </CardTitle>
              <CardDescription>
                Membuka tenant masuk ke mode dukungan. Perubahan milik
                pelanggan tetap di shell mereka.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQuery.isLoading && (
                <Skeleton className="h-16 w-full" />
              )}
              {!recentQuery.isLoading && recent.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Belum ada tenant. Buat tenant dari direktori.
                </p>
              )}
              {recent.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-default-900">
                      {tenant.name}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {tenant.slug}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TenantStatusBadge status={tenant.status} />
                    <TenantTierBadge tierId={tenant.tierId} />
                    <TenantBillingStatusBadge status={tenant.billingStatus} />
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/tenants/$tenantId"
                        params={{ tenantId: tenant.id }}
                      >
                        Buka
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert color="info" variant="soft">
          <AlertTitle className="text-sm">Menu mengikuti peran Anda</AlertTitle>
          <AlertDescription className="text-xs">
            Ringkasan tenant dan ledger terbuka untuk peran yang memegang izin
            direktori tenant.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {canReadUsers && (
          <Button variant="outline" asChild>
            <Link to="/platform/users">
              <UserCog className="mr-2 h-4 w-4" />
              Direktori akun
            </Link>
          </Button>
        )}
        {canReadUsers && (
          <Button variant="outline" asChild>
            <Link to="/platform/staff">Staf platform</Link>
          </Button>
        )}
        {canReadAudit && (
          <Button variant="outline" asChild>
            <Link to="/platform/audit">
              <ScrollText className="mr-2 h-4 w-4" />
              Audit
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
