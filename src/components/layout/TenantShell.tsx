import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import type { TenantRecord } from "@/api/tenant-service";
import { tenantNav } from "@/config/menus";
import { type TenantShellMode } from "@/lib/console-shell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TenantSwitcher } from "@/components/layout/TenantSwitcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TenantShell({
  mode,
  tenant,
  children,
}: {
  mode: TenantShellMode;
  tenant: TenantRecord;
  children: ReactNode;
}) {
  const items = tenantNav(tenant.id);

  return (
    <div className="space-y-4">
      {mode === "support" && (
        <Alert color="info" variant="soft">
          <Eye className="h-4 w-4" aria-hidden />
          <AlertTitle className="text-sm">Melihat sebagai operator</AlertTitle>
          <AlertDescription className="text-xs">
            Mode dukungan hanya membaca konfigurasi tenant.{" "}
            <Link
              to="/platform/tenants"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Kembali ke daftar tenant platform
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {mode === "owner" ? (
          <TenantSwitcher currentName={tenant.name} />
        ) : (
          <h1 className="text-xl font-semibold tracking-tight text-default-900">
            {tenant.name}
          </h1>
        )}
      </div>

      <div className="flex min-h-[calc(100vh-8rem)] gap-0 lg:-mx-2">
        <AppSidebar items={items} logoHref={`/tenants/${tenant.id}`} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}