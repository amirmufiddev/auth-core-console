import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Layers,
  Plus,
  User,
} from "lucide-react";
import { adminListTenants, listMyTenants } from "@/api/tenant-service";
import { isExternalBackendConfigured } from "@/api/client";
import { isPlatformActor, toConsoleActor } from "@/lib/console-shell";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function tenantIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/tenants\/([^/]+)/);
  return match?.[1] ?? null;
}

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((s) => s.user);
  const actor = toConsoleActor(user);
  const isPlatform = isPlatformActor(actor);
  const activeTenantId = tenantIdFromPath(pathname);

  const ownerTenantsQuery = useQuery({
    queryKey: ["workspace-switcher-my-tenants"],
    queryFn: () => listMyTenants({ page: 0, pageSize: 50 }),
    enabled: Boolean(user) && !isPlatform,
    staleTime: 60_000,
  });

  const operatorTenantsQuery = useQuery({
    queryKey: ["workspace-switcher-admin-tenants"],
    queryFn: () => adminListTenants({ page: 0, pageSize: 50 }),
    enabled: Boolean(user) && isPlatform,
    staleTime: 60_000,
  });

  const ownerTenants = ownerTenantsQuery.data?.items ?? [];
  const operatorTenants = operatorTenantsQuery.data?.items ?? [];
  const activeOwnerTenant = ownerTenants.find((t) => t.id === activeTenantId);
  const activeOperatorTenant = operatorTenants.find(
    (t) => t.id === activeTenantId,
  );

  let triggerLabel = "Personal Account";
  if (isPlatform && pathname.startsWith("/platform")) {
    triggerLabel = "Platform Console";
  } else if (activeOwnerTenant) {
    triggerLabel = activeOwnerTenant.name;
  } else if (activeOperatorTenant) {
    triggerLabel = activeOperatorTenant.name;
  } else if (pathname.startsWith("/tenants")) {
    triggerLabel = "Portal Tenant";
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          color="secondary"
          size="sm"
          className="hidden h-9 max-w-50 justify-between gap-2 bg-card sm:inline-flex"
        >
          <span className="flex min-w-0 items-center gap-2">
            {isPlatform && pathname.startsWith("/platform") ? (
              <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : activeTenantId ? (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-xs font-medium">{triggerLabel}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Tenant / Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isPlatform && (
          <DropdownMenuItem
            onClick={() => void navigate({ to: "/platform" })}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Platform Console</span>
            </span>
            {pathname.startsWith("/platform") && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        )}

        {!isPlatform && (
          <DropdownMenuItem
            onClick={() => void navigate({ to: "/tenants" })}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Portal Tenant</span>
            </span>
            {!activeTenantId && pathname.startsWith("/tenants") && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isPlatform
          ? operatorTenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() =>
                  void navigate({
                    to: "/tenants/$tenantId",
                    params: { tenantId: tenant.id },
                  })
                }
                className="flex items-center justify-between gap-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">
                    {tenant.name}
                  </span>
                </span>
                {activeTenantId === tenant.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          : ownerTenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() =>
                  void navigate({
                    to: "/tenants/$tenantId",
                    params: { tenantId: tenant.id },
                  })
                }
                className="flex items-center justify-between gap-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">
                    {tenant.name}
                  </span>
                </span>
                {activeTenantId === tenant.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

        {!isPlatform && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/tenants" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="text-xs font-medium">Buat Tenant Baru</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {isPlatform && isExternalBackendConfigured() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/platform/tenants" className="text-xs font-medium">
                Kelola semua tenant (operator)
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}