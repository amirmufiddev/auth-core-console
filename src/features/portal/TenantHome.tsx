import { Link } from "@tanstack/react-router";
import { AppWindow, Copy, KeyRound, Users } from "lucide-react";
import { toast } from "sonner";
import type { TenantRecord } from "@/api/tenant-service";
import type { TenantShellMode } from "@/lib/console-shell";
import { Can } from "@/components/layout/Can";
import { PortalTenantSupportActions } from "@/features/portal/PortalTenantSupportActions";
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

function loginUrl(slug: string): string {
  if (typeof window === "undefined") return `/t/${slug}/login`;
  return `${window.location.origin}/t/${slug}/login`;
}

export function TenantHome({
  tenant,
  mode,
}: {
  tenant: TenantRecord;
  mode: TenantShellMode;
}) {
  const url = loginUrl(tenant.slug);

  async function copyLoginUrl() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL login disalin.");
    } catch {
      toast.error("Salin URL gagal. Pilih teksnya secara manual.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Batas identitas aplikasi Anda. Pengguna dan workspace hidup di
            dalam tenant ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <TenantStatusBadge status={tenant.status} />
          <TenantTierBadge tierId={tenant.tierId} />
          <TenantBillingStatusBadge status={tenant.billingStatus} />
        </div>
      </div>

      <Card>
        <CardHeader className="mb-0">
          <CardTitle className="text-base font-semibold">
            URL login pengguna
          </CardTitle>
          <CardDescription>
            Arahkan aplikasi Anda ke alamat ini. Slug{" "}
            <span className="font-mono">{tenant.slug}</span> terkunci setelah
            tenant dibuat.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
            {url}
          </code>
          <Button type="button" variant="outline" onClick={() => void copyLoginUrl()}>
            <Copy className="mr-2 h-4 w-4" />
            Salin
          </Button>
        </CardContent>
      </Card>

      {mode === "support" && (
        <Can resource="organization" action="update">
          <PortalTenantSupportActions tenant={tenant} />
        </Can>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AppWindow className="h-4 w-4 text-primary" />
              Hubungkan aplikasi
            </CardTitle>
            <CardDescription>
              Daftarkan OAuth client agar aplikasi pelanggan bisa login ke
              tenant ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button color="primary" asChild>
              <Link
                to="/tenants/$tenantId/oauth-clients"
                params={{ tenantId: tenant.id }}
              >
                Aplikasi terhubung
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <KeyRound className="h-4 w-4 text-primary" />
              Kunci server
            </CardTitle>
            <CardDescription>
              API key dipakai server aplikasi, terpisah dari login pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link
                to="/tenants/$tenantId/api-keys"
                params={{ tenantId: tenant.id }}
              >
                API key
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Pengguna dan workspace
            </CardTitle>
            <CardDescription>
              Pengguna mendaftar lewat URL login. Workspace dan undangannya
              dibuat dari aplikasi yang terhubung.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link
                to="/tenants/$tenantId/users"
                params={{ tenantId: tenant.id }}
              >
                Pengguna
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                to="/tenants/$tenantId/organizations"
                params={{ tenantId: tenant.id }}
              >
                Organisasi
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
