import type { ReactNode } from "react";
import { Building2, Moon, ShieldCheck, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { AnimatedAuthBackground } from "@/components/auth/AnimatedAuthBackground";
import { AppLogo } from "@/components/layout/AppLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TenantAuthLayoutProps {
  tenantSlug: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export function TenantAuthLayout({
  tenantSlug,
  title,
  subtitle,
  children,
}: TenantAuthLayoutProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <AnimatedAuthBackground />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 text-card-foreground shadow-xl sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <Badge
              color="secondary"
              variant="soft"
              className="inline-flex items-center gap-1.5 font-mono text-[11px]"
            >
              <Building2 className="h-3 w-3 text-primary" />
              {tenantSlug}
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            color="secondary"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Mode"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-warning" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {(title || subtitle) && (
          <div className="space-y-1 pt-1 text-center">
            {title && (
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="w-full">{children}</div>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Hosted Tenant Authentication · Auth Core</span>
        </div>
      </div>
    </section>
  );
}
