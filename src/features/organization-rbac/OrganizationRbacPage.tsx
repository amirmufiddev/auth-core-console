import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createOrganizationPermission,
  createOrganizationRole,
  createOrganizationRoleTemplate,
  deleteOrganizationPermission,
  deleteOrganizationRole,
  deleteOrganizationRoleTemplate,
  listOrganizationCatalog,
  listOrganizationRoleTemplates,
  listOrganizationRoles,
  updateOrganizationPermission,
  updateOrganizationRole,
  updateOrganizationRoleTemplate,
  type OrganizationRoleRecord,
  type OrganizationRoleTemplateRecord,
  type PermissionMap,
} from "@/api/organization-rbac";
import { listTenantOrganizations } from "@/api/tenant-service";
import { PermissionMatrix } from "@/features/organization-rbac/PermissionMatrix";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OrganizationRbacPage({
  tenantId,
  readOnly,
}: {
  tenantId: string;
  readOnly: boolean;
}) {
  if (readOnly) {
    return (
      <Alert color="info" variant="soft">
        <AlertTitle>Dikelola pemilik tenant</AlertTitle>
        <AlertDescription>
          Mode support hanya melihat tenant. Katalog permission, template role,
          dan role organisasi diubah oleh pemilik tenant. Owner organisasi
          mengubah role lewat API, karena member organisasi tidak masuk ke Auth
          Core.
        </AlertDescription>
      </Alert>
    );
  }

  return <OrganizationRbacEditor tenantId={tenantId} />;
}

function OrganizationRbacEditor({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["org-catalog", tenantId],
    queryFn: () => listOrganizationCatalog(tenantId),
  });
  const templatesQuery = useQuery({
    queryKey: ["org-role-templates", tenantId],
    queryFn: () => listOrganizationRoleTemplates(tenantId),
  });
  const orgsQuery = useQuery({
    queryKey: ["org-rbac-orgs", tenantId],
    queryFn: () =>
      listTenantOrganizations(tenantId, { page: 0, pageSize: 100 }),
  });

  const resources = catalogQuery.data?.resources ?? [];
  const permissions = catalogQuery.data?.permissions ?? [];
  const templates = templatesQuery.data ?? [];
  const organizations = orgsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-default-900">
          Role & permission organisasi
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Katalog dan template berlaku untuk tenant ini. Role organisasi adalah
          salinan yang dipakai satu organisasi. Owner organisasi tetap bisa
          mengubah role itu lewat API.
        </p>
      </div>
      {catalogQuery.isError ? (
        <Alert color="destructive" variant="soft">
          <AlertTitle>Katalog tidak bisa dimuat</AlertTitle>
          <AlertDescription>
            {errorMessage(catalogQuery.error, "Gagal memuat katalog.")}
          </AlertDescription>
        </Alert>
      ) : null}
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Katalog</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
          <TabsTrigger value="roles">Role organisasi</TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-4">
          <CatalogTab
            tenantId={tenantId}
            permissions={permissions}
            loading={catalogQuery.isLoading}
            onChanged={() => {
              void queryClient.invalidateQueries({
                queryKey: ["org-catalog", tenantId],
              });
            }}
          />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplateTab
            tenantId={tenantId}
            resources={resources}
            templates={templates}
            loading={templatesQuery.isLoading}
            onChanged={() => {
              void queryClient.invalidateQueries({
                queryKey: ["org-role-templates", tenantId],
              });
            }}
          />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <OrganizationRoleTab
            tenantId={tenantId}
            resources={resources}
            organizations={organizations.map((org) => ({
              id: org.id,
              name: org.name,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CatalogTab({
  tenantId,
  permissions,
  loading,
  onChanged,
}: {
  tenantId: string;
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
    displayName: string;
    code: string;
  }>;
  loading: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    resource: "",
    action: "",
    resourceDisplayName: "",
    actionDisplayName: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganizationPermission(tenantId, {
        resource: form.resource.trim(),
        action: form.action.trim(),
        resourceDisplayName: form.resourceDisplayName.trim(),
        actionDisplayName: form.actionDisplayName.trim(),
      }),
    onSuccess: () => {
      toast.success(
        "Permission ditambahkan. Restart API agar Better Auth mengenal resource baru.",
      );
      setOpen(false);
      setForm({
        resource: "",
        action: "",
        resourceDisplayName: "",
        actionDisplayName: "",
      });
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menambah permission.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganizationPermission(tenantId, id),
    onSuccess: () => {
      toast.success("Permission dihapus dari katalog.");
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus permission.")),
  });

  const renameMutation = useMutation({
    mutationFn: (input: { id: string; actionDisplayName: string }) =>
      updateOrganizationPermission(tenantId, input.id, {
        actionDisplayName: input.actionDisplayName,
      }),
    onSuccess: () => {
      toast.success("Label permission diperbarui.");
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal mengubah label.")),
  });

  const grouped = new Map<string, typeof permissions>();
  for (const permission of permissions) {
    const list = grouped.get(permission.resource) ?? [];
    list.push(permission);
    grouped.set(permission.resource, list);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Katalog permission</CardTitle>
          <CardDescription>
            Daftar resource dan action yang boleh dipakai template serta role
            organisasi.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat katalog...</p>
        ) : permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada permission.</p>
        ) : (
          [...grouped.entries()].map(([resource, actions]) => (
            <section key={resource} className="space-y-2">
              <h3 className="font-mono text-sm font-semibold">{resource}</h3>
              <div className="divide-y rounded-md border">
                {actions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {permission.displayName}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {permission.code}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = window.prompt(
                            "Label action",
                            permission.displayName,
                          );
                          if (!next || next === permission.displayName) return;
                          renameMutation.mutate({
                            id: permission.id,
                            actionDisplayName: next,
                          });
                        }}
                      >
                        Ubah label
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        color="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(permission.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah permission</DialogTitle>
            <DialogDescription>
              Resource dan action memakai huruf kecil, angka, dan strip.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field
              label="Resource"
              value={form.resource}
              onChange={(resource) => setForm({ ...form, resource })}
            />
            <Field
              label="Nama resource"
              value={form.resourceDisplayName}
              onChange={(resourceDisplayName) =>
                setForm({ ...form, resourceDisplayName })
              }
            />
            <Field
              label="Action"
              value={form.action}
              onChange={(action) => setForm({ ...form, action })}
            />
            <Field
              label="Nama action"
              value={form.actionDisplayName}
              onChange={(actionDisplayName) =>
                setForm({ ...form, actionDisplayName })
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TemplateTab({
  tenantId,
  resources,
  templates,
  loading,
  onChanged,
}: {
  tenantId: string;
  resources: Array<{
    resource: string;
    displayName: string;
    description?: string;
    actions: Record<string, { displayName: string; description?: string }>;
  }>;
  templates: OrganizationRoleTemplateRecord[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<PermissionMap>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const current =
    templates.find((template) => template.roleName === selected) ??
    templates[0] ??
    null;

  useEffect(() => {
    if (!current) return;
    setSelected(current.roleName);
    setDraft(structuredClone(current.permission));
  }, [current]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!current) throw new Error("Pilih template.");
      return updateOrganizationRoleTemplate(tenantId, current.roleName, {
        role: current.roleName,
        permission: draft,
      });
    },
    onSuccess: () => {
      toast.success("Template disimpan. Organisasi baru akan memakai salinan ini.");
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menyimpan template.")),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganizationRoleTemplate(tenantId, {
        roleName: roleName.trim().toLowerCase(),
        role: roleName.trim().toLowerCase(),
        permission: {},
      }),
    onSuccess: (created) => {
      toast.success(`Template ${created.roleName} dibuat.`);
      setCreateOpen(false);
      setRoleName("");
      setSelected(created.roleName);
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal membuat template.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteOrganizationRoleTemplate(tenantId, name),
    onSuccess: () => {
      toast.success("Template dihapus.");
      setSelected("");
      onChanged();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus template.")),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Template role</CardTitle>
          <CardDescription>
            Disalin ke organization_role saat organisasi baru dibuat. Template
            owner tidak bisa dihapus.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Template
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat template...</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.roleName}
                type="button"
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  current?.roleName === template.roleName
                    ? "bg-default-100 font-semibold"
                    : "hover:bg-default-50"
                }`}
                onClick={() => setSelected(template.roleName)}
              >
                {template.roleName}
              </button>
            ))
          )}
        </div>
        {current ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-sm font-semibold">
                {current.roleName}
              </h3>
              <div className="flex gap-2">
                {current.roleName !== "owner" ? (
                  <Button
                    type="button"
                    variant="outline"
                    color="destructive"
                    onClick={() => deleteMutation.mutate(current.roleName)}
                  >
                    Hapus
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  Simpan
                </Button>
              </div>
            </div>
            <PermissionMatrix
              resources={resources}
              value={draft}
              onChange={setDraft}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada template.</p>
        )}
      </CardContent>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template baru</DialogTitle>
            <DialogDescription>
              Nama diawali huruf kecil. Contoh: cashier atau finance_admin.
            </DialogDescription>
          </DialogHeader>
          <Field label="Nama role" value={roleName} onChange={setRoleName} />
          <DialogFooter>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function OrganizationRoleTab({
  tenantId,
  resources,
  organizations,
}: {
  tenantId: string;
  resources: Array<{
    resource: string;
    displayName: string;
    description?: string;
    actions: Record<string, { displayName: string; description?: string }>;
  }>;
  organizations: Array<{ id: string; name: string }>;
}) {
  const queryClient = useQueryClient();
  const [organizationId, setOrganizationId] = useState(
    organizations[0]?.id ?? "",
  );
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<PermissionMap>({});
  const [draftName, setDraftName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    if (!organizationId && organizations[0]) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizationId, organizations]);

  const rolesQuery = useQuery({
    queryKey: ["org-roles", tenantId, organizationId],
    queryFn: () => listOrganizationRoles(tenantId, organizationId),
    enabled: Boolean(organizationId),
  });
  const roles = rolesQuery.data ?? [];
  const current =
    roles.find((role) => role.id === selectedId) ?? roles[0] ?? null;

  useEffect(() => {
    if (!current) return;
    setSelectedId(current.id);
    setDraftName(current.role);
    setDraft(structuredClone(current.permission));
  }, [current]);

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["org-roles", tenantId, organizationId],
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!current) throw new Error("Pilih role.");
      return updateOrganizationRole(tenantId, organizationId, current.id, {
        role: draftName.trim().toLowerCase(),
        permission: draft,
      });
    },
    onSuccess: () => {
      toast.success("Role organisasi disimpan.");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menyimpan role.")),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganizationRole(tenantId, organizationId, {
        role: roleName.trim().toLowerCase(),
        permission: {},
      }),
    onSuccess: (created) => {
      toast.success(`Role ${created.role} dibuat.`);
      setCreateOpen(false);
      setRoleName("");
      setSelectedId(created.id);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal membuat role.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (role: OrganizationRoleRecord) =>
      deleteOrganizationRole(tenantId, organizationId, role.id),
    onSuccess: () => {
      toast.success("Role dihapus.");
      setSelectedId("");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus role.")),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Role per organisasi</CardTitle>
          <CardDescription>
            Perubahan di sini langsung berlaku untuk organisasi yang dipilih.
            Role owner tidak bisa diubah atau dihapus.
          </CardDescription>
        </div>
        <Button
          type="button"
          disabled={!organizationId}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Role
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-1.5">
          <Label>Organisasi</Label>
          <Select
            value={organizationId}
            onValueChange={(value) => {
              setOrganizationId(value);
              setSelectedId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih organisasi" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!organizationId ? (
          <p className="text-sm text-muted-foreground">
            Tenant ini belum punya organisasi.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="space-y-1">
              {rolesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat role...</p>
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      current?.id === role.id
                        ? "bg-default-100 font-semibold"
                        : "hover:bg-default-50"
                    }`}
                    onClick={() => setSelectedId(role.id)}
                  >
                    {role.role}
                  </button>
                ))
              )}
            </div>
            {current ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <Field
                    label="Nama role"
                    value={draftName}
                    disabled={current.role === "owner"}
                    onChange={setDraftName}
                  />
                  <div className="flex gap-2">
                    {current.role !== "owner" ? (
                      <Button
                        type="button"
                        variant="outline"
                        color="destructive"
                        onClick={() => deleteMutation.mutate(current)}
                      >
                        Hapus
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      disabled={
                        current.role === "owner" || saveMutation.isPending
                      }
                      onClick={() => saveMutation.mutate()}
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
                <PermissionMatrix
                  resources={resources}
                  value={draft}
                  disabled={current.role === "owner"}
                  onChange={setDraft}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Organisasi ini belum punya role.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role organisasi baru</DialogTitle>
            <DialogDescription>
              Nama owner tidak bisa dipakai. Isi permission setelah role dibuat.
            </DialogDescription>
          </DialogHeader>
          <Field label="Nama role" value={roleName} onChange={setRoleName} />
          <DialogFooter>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
