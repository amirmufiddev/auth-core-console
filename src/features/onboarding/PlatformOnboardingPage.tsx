import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Globe, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createMyTenant, slugifyTenantName } from "@/api/tenant-service";
import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CreatePortalTenantValues,
  createPortalTenantSchema,
} from "@/features/portal/schema";

export function PlatformOnboardingPage() {
  const navigate = useNavigate();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreatePortalTenantValues>({
    resolver: zodResolver(createPortalTenantSchema),
    defaultValues: { name: "", slug: "" },
  });

  const slugValue = form.watch("slug");

  const createMutation = useMutation({
    mutationFn: createMyTenant,
    onSuccess: (created) => {
      toast.success(`Tenant '${created.name}' berhasil dibuat.`);
      void navigate({
        to: "/tenants/$tenantId",
        params: { tenantId: created.id },
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat tenant baru.",
      );
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[580px] rounded-xl border border-border shadow-sm">
        <CardContent className="space-y-6 p-8 sm:p-9">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo size="lg" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-default-900">
                Buat tenant pertama Anda
              </h1>
              <p className="text-sm text-muted-foreground">
                Tenant adalah lingkungan IAM terpisah dengan URL hosted auth dan
                konsol kelola tenant Anda sendiri.
              </p>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit((vals) => createMutation.mutate(vals))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="onboard-ten-name">Nama Tenant</Label>
              <Input
                id="onboard-ten-name"
                placeholder="Mis. PT Maju Bersama"
                {...form.register("name", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (!slugTouched) {
                      form.setValue("slug", slugifyTenantName(e.target.value));
                    }
                  },
                })}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="onboard-ten-slug">Slug Tenant (permanen)</Label>
              <Input
                id="onboard-ten-slug"
                placeholder="maju-bersama"
                className="font-mono text-sm"
                {...form.register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
              {slugValue.trim().length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    URL hosted:{" "}
                    <span className="font-mono text-foreground">
                      /t/{slugValue.trim().toLowerCase()}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              color="primary"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="mr-2 h-4 w-4" />
              )}
              Buat Tenant &amp; Lanjutkan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}