import { useState } from "react";
import { Link, useMatches, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Radio,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { menusConfig } from "@/config/menus";
import { isExternalBackendConfigured } from "@/api/client";
import type { ActorRoleGrant } from "@/lib/console-shell";
import { cn, isLocationMatch } from "@/lib/utils";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { SignedIn, UserButton } from "@/components/better-auth";
import { filterPlatformNavItems } from "@/lib/filter-platform-nav";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { AppLogo } from "@/components/layout/AppLogo";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/users": "Users",
  "/roles": "Roles & RBAC",
  "/organizations": "Organizations",
  "/sessions": "Sessions & Devices",
  "/api-keys": "API Keys & OAuth",
  "/audit-logs": "Audit Logs",
  "/auth-features": "Auth Features",
  "/account": "Account Settings",
  "/admin-tenants": "Tenants (Operator)",
  "/admin-tiers": "Feature & Tier Matrix",
  "/admin-billing": "Billing Ledger",
  "/tenants": "Tenant Portal",
  "/platform": "Overview",
  "/platform/tenants": "Tenants",
  "/platform/tiers": "Feature & Tier Matrix",
  "/platform/billing": "Billing Ledger",
  "/platform/staff": "Staf platform",
  "/platform/users": "Direktori akun",
  "/platform/roles": "Role Platform",
  "/platform/sessions": "Sesi Staf",
  "/platform/audit": "Audit Platform",
  "/platform/auth-features": "Auth Features",
  "/platform/account": "Akun",
};

function platformRolesFromMatches(
  matches: ReturnType<typeof useMatches>,
): ActorRoleGrant[] | undefined {
  const platformMatch = matches.find(
    (match) => match.routeId === "/_authenticated/platform",
  );
  const context = platformMatch?.context as { roles?: ActorRoleGrant[] } | undefined;
  return context?.roles;
}

export function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const matches = useMatches();
  const isPlatformShell = pathname.startsWith("/platform");
  const platformRoles = isPlatformShell
    ? platformRolesFromMatches(matches)
    : undefined;

  const quickNavItems = isPlatformShell
    ? (platformRoles ? filterPlatformNavItems(platformRoles) : []).filter(
        (item) => Boolean(item.href),
      )
    : [];
  const filteredNavItems = searchQuery.trim()
    ? quickNavItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : [];

  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const navbarType = useThemeStore((s) => s.navbarType);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const navStyle = useLayoutStore((s) => s.navStyle);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const sidebarType = useLayoutStore((s) => s.sidebarType);
  const toggleSidebarCollapsed = useLayoutStore(
    (s) => s.toggleSidebarCollapsed,
  );
  const setMobileSidebarOpen = useLayoutStore((s) => s.setMobileSidebarOpen);
  const isSidebarCollapsed =
    sidebarCollapsed || sidebarType === "popover";

  const isExternalApi = isExternalBackendConfigured();
  const homeCrumb = isPlatformShell ? "/platform" : "/dashboard";
  const settingsHref = isPlatformShell ? "/platform/account" : "/account";
  const horizontalNavItems = isPlatformShell
    ? quickNavItems
    : menusConfig.mainNav.flatMap((group) =>
        (group.child ?? []).filter((item) => Boolean(item.href)),
      );
  const currentLabel =
    ROUTE_TITLES[pathname] ??
    (pathname.startsWith("/tenants/") ? "Detail Tenant" : "Console");

  if (navbarType === "hidden") {
    return null;
  }

  return (
    <header
      className={cn(
        "z-30 border-b border-border bg-card/95 backdrop-blur transition-all",
        navbarType === "sticky" && "sticky top-0",
        navbarType === "static" && "relative",
        navbarType === "floating" &&
          "sticky top-3 mx-4 mt-3 rounded-xl border shadow-sm sm:mx-6",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            color="secondary"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {navStyle === "horizontal" && (
            <Link
              to={homeCrumb}
              className="hidden items-center gap-2 lg:flex"
            >
              <AppLogo showText size="sm" />
            </Link>
          )}

          {navStyle !== "horizontal" && (
            <Button
              type="button"
              variant="ghost"
              color="secondary"
              size="icon"
              className="hidden h-9 w-9 shrink-0 lg:inline-flex"
              onClick={toggleSidebarCollapsed}
              aria-label={
                isSidebarCollapsed ? "Perluas sidebar" : "Perkecil sidebar"
              }
              aria-expanded={!isSidebarCollapsed}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}

          <Breadcrumbs size="sm">
            <BreadcrumbItem href={homeCrumb}>Auth Core</BreadcrumbItem>
            <BreadcrumbItem isCurrent>{currentLabel}</BreadcrumbItem>
          </Breadcrumbs>
        </div>

        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu atau modul..."
            className="h-9 bg-surface-subtle pl-9 text-xs border-border/70 focus-visible:border-primary/40 focus-visible:bg-card"
          />
          {filteredNavItems.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
              {filteredNavItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      if (item.href) {
                        void navigate({ to: item.href });
                        setSearchQuery("");
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge
            color={isExternalApi ? "success" : "info"}
            variant="soft"
            className="hidden items-center gap-1.5 xl:inline-flex"
          >
            <Radio className="h-3 w-3" />
            {isExternalApi ? "Live Auth Core API" : "Local Hybrid Mode"}
          </Badge>

          <SignedIn>
            <WorkspaceSwitcher />
          </SignedIn>

          <Button
            type="button"
            variant="ghost"
            color="secondary"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
            aria-label="Ganti tema Light/Dark"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            color="secondary"
            size="icon"
            className="h-9 w-9"
            asChild
            aria-label="Pengaturan Tema & Akun"
          >
            <Link to={settingsHref} search={{ tab: "preferences" }}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {navStyle === "horizontal" && (
        <div className="hidden border-t border-border bg-card px-6 py-2 lg:flex lg:items-center lg:gap-1">
          {horizontalNavItems.map((item) => {
            if (!item.href) return null;
            const Icon = item.icon;
            const active = isLocationMatch(item.href, pathname);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-accent/70 hover:text-accent-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}