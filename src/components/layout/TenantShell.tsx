import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import type { TenantRecord } from "@/api/tenant-service";
import { type TenantShellMode } from "@/lib/console-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function TenantShell({
  mode,
  tenant: _tenant,
  children,
}: {
  mode: TenantShellMode;
  tenant: TenantRecord;
  children: ReactNode;
}) {
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
      {children}
    </div>
  );
}