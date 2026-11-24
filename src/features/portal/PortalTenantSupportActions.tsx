import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Layers } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  TENANT_TIER_OPTIONS,
  type TenantRecord,
  type TenantStatus,
  adminUpdateTenantStatus,
  adminUpdateTenantTier,
} from "@/api/tenant-service";
import {
  type AdminChangeTierValues,
  adminChangeTierSchema,
} from "@/features/admin-tenants/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PortalTenantSupportActions({
  tenant,
}: {
  tenant: TenantRecord;
}) {
  const queryClient = useQueryClient();
  const [tierOpen, setTierOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    nextStatus: TenantStatus;
  } | null>(null);

  const tierForm = useForm<AdminChangeTierValues>({
    resolver: zodResolver(adminChangeTierSchema),
    defaultValues: { tierId: tenant.tierId },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ tierId }: { tierId: string }) =>
      adminUpdateTenantTier(tenant.id, tierId),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant", tenant.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(
        `Tier tenant '${updated.name}' diperbarui (config v${updated.configVersion}).`,
      );
      setTierOpen(false);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah tier tenant.",
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: TenantStatus) =>
      adminUpdateTenantStatus(tenant.id, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: ["portal-tenant", tenant.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(
        updated.status === "suspended"
          ? `Tenant '${updated.name}' ditangguhkan.`
          : `Tenant '${updated.name}' diaktifkan kembali.`,
      );
      setStatusTarget(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui status tenant.",
      );
    },
  });

  const isActive = tenant.status === "active";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        color="secondary"
        size="sm"
        onClick={() => {
          tierForm.reset({ tierId: tenant.tierId });
          setTierOpen(true);
        }}
      >
        <Layers className="mr-1.5 h-4 w-4" />
        Ubah Tier
      </Button>
      {isActive ? (
        <Button
          type="button"
          variant="outline"
          color="destructive"
          size="sm"
          onClick={() => setStatusTarget({ nextStatus: "suspended" })}
        >
          <Ban className="mr-1.5 h-4 w-4" />
          Suspend
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          color="success"
          size="sm"
          onClick={() => setStatusTarget({ nextStatus: "active" })}
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          Aktifkan
        </Button>
      )}

      <Dialog open={tierOpen} onOpenChange={setTierOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Ubah Tier Tenant</DialogTitle>
            <DialogDescription>
              Pilih tier baru untuk {tenant.name} ({tenant.slug}).
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={tierForm.handleSubmit((vals) =>
              updateTierMutation.mutate({ tierId: vals.tierId }),
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Tier Paket</Label>
              <Controller
                control={tierForm.control}
                name="tierId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_TIER_OPTIONS.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name} — {tier.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => setTierOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={updateTierMutation.isPending}
              >
                {updateTierMutation.isPending ? "Memperbarui..." : "Simpan Tier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.nextStatus === "suspended"
                ? "Tangguhkan Tenant?"
                : "Aktifkan Kembali Tenant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.nextStatus === "suspended"
                ? `Tenant '${tenant.name}' (${tenant.slug}) akan dinonaktifkan.`
                : `Tenant '${tenant.name}' akan diaktifkan kembali.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel color="secondary" variant="outline">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              color={
                statusTarget?.nextStatus === "suspended"
                  ? "destructive"
                  : "success"
              }
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (!statusTarget) return;
                updateStatusMutation.mutate(statusTarget.nextStatus);
              }}
            >
              {statusTarget?.nextStatus === "suspended"
                ? "Ya, Suspend"
                : "Ya, Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}