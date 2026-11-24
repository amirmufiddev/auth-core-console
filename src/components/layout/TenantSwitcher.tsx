import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronsUpDown } from "lucide-react";
import { listMyTenants } from "@/api/tenant-service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TenantSwitcher({ currentName }: { currentName: string }) {
  const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
  const navigate = useNavigate();

  const tenantsQuery = useQuery({
    queryKey: ["portal-tenants-switcher"],
    queryFn: () => listMyTenants({ page: 0, pageSize: 50 }),
  });

  const items = tenantsQuery.data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          color="secondary"
          className="h-9 max-w-xs justify-between gap-2 font-semibold"
        >
          <span className="truncate">{currentName}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Tenant Saya</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            className={tenant.id === tenantId ? "bg-muted" : undefined}
            onClick={() => {
              void navigate({ to: "/tenants/$tenantId", params: { tenantId: tenant.id } });
            }}
          >
            <div className="flex flex-col">
              <span className="font-medium">{tenant.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {tenant.slug}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        {items.length === 0 && !tenantsQuery.isLoading && (
          <DropdownMenuItem disabled>Tidak ada tenant</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}