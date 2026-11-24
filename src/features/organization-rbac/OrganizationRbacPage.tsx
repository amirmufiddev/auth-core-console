import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckSquare,
  Copy,
  KeyRound,
  Layers,
  Lock,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
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
  type CatalogPermission,
  type CatalogResource,
  type OrganizationRoleRecord,
  type OrganizationRoleTemplateRecord,
  type PermissionMap,
} from "@/api/organization-rbac";
import { listTenantOrganizations } from "@/api/tenant-service";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

function countGrants(permission: PermissionMap): number {
  return Object.values(permission).reduce(
    (sum, actions) => sum + actions.length,
    0,
  );
}

function totalActions(resources: CatalogResource[]): number {
  return resources.reduce(
    (sum, resource) => sum + Object.keys(resource.actions).length,
    0,
  );
}

export function OrganizationRbacPage({
  tenantId,
  readOnly,
}: {
  tenantId: string;
  readOnly: boolean;
}) {
  const [tab, setTab] = useState("templates");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-default-900">
            Role & Permission Organisasi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Katalog, template, dan role yang berlaku di organisasi tenant ini.
            {readOnly
              ? " Mode dukungan hanya membaca. Perubahan dilakukan pemilik tenant."
              : null}
          </p>
        </div>
        {readOnly ? null : (
          <Button color="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tab === "catalog"
              ? "Tambah Permission"
              : tab === "roles"
                ? "Buat Role Organisasi"
                : "Buat Template"}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Template
          </TabsTrigger>
          <TabsTrigger value="roles">
            <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
            Role organisasi
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <KeyRound className="mr-1.5 h-3.5 w-3.5" />
            Katalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="pt-5">
          <TemplateWorkspace
            tenantId={tenantId}
            readOnly={readOnly}
            createOpen={tab === "templates" && createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </TabsContent>
        <TabsContent value="roles" className="pt-5">
          <OrganizationRoleWorkspace
            tenantId={tenantId}
            readOnly={readOnly}
            createOpen={tab === "roles" && createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </TabsContent>
        <TabsContent value="catalog" className="pt-5">
          <CatalogWorkspace
            tenantId={tenantId}
            readOnly={readOnly}
            createOpen={tab === "catalog" && createOpen}
            onCreateOpenChange={setCreateOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateWorkspace({
  tenantId,
  readOnly,
  createOpen,
  onCreateOpenChange,
}: {
  tenantId: string;
  readOnly: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["org-catalog", tenantId],
    queryFn: () => listOrganizationCatalog(tenantId),
  });
  const templatesQuery = useQuery({
    queryKey: ["org-role-templates", tenantId],
    queryFn: () => listOrganizationRoleTemplates(tenantId),
  });
  const resources = catalogQuery.data?.resources ?? [];
  const templates = templatesQuery.data ?? [];
  const [selectedName, setSelectedName] = useState("");
  const [draft, setDraft] = useState<PermissionMap>({});
  const [deleteTarget, setDeleteTarget] =
    useState<OrganizationRoleTemplateRecord | null>(null);
  const [roleName, setRoleName] = useState("");

  const selected =
    templates.find((template) => template.roleName === selectedName) ??
    templates[0] ??
    null;

  useEffect(() => {
    if (!selected) return;
    if (!selectedName) setSelectedName(selected.roleName);
    setDraft(structuredClone(selected.permission ?? {}));
  }, [selected, selectedName]);

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["org-role-templates", tenantId],
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Pilih template.");
      return updateOrganizationRoleTemplate(tenantId, selected.roleName, {
        role: selected.roleName,
        permission: draft,
      });
    },
    onSuccess: () => {
      toast.success("Matriks template berhasil disimpan.");
      refresh();
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
      toast.success(`Template "${created.roleName}" berhasil dibuat.`);
      setSelectedName(created.roleName);
      setRoleName("");
      onCreateOpenChange(false);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal membuat template.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteOrganizationRoleTemplate(tenantId, name),
    onSuccess: () => {
      toast.success("Template berhasil dihapus.");
      setSelectedName("");
      setDeleteTarget(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus template.")),
  });

  const available = totalActions(resources);

  return (
    <>
      <QueryError
        title="Gagal Memuat Template"
        error={templatesQuery.error ?? catalogQuery.error}
      />
      <SplitWorkspace
        title={`Daftar Template (${templates.length})`}
        description="Pilih template untuk mengatur hak akses per modul."
        empty="Belum ada template."
        items={templates.map((template) => ({
          id: template.roleName,
          title: template.roleName,
          description: "Disalin ke organisasi baru di tenant ini.",
          meta: template.roleName,
          countLabel: `${countGrants(template.permission ?? {})}/${available} izin`,
          locked: template.roleName === "owner",
        }))}
        selectedId={selected?.roleName ?? ""}
        onSelect={setSelectedName}
        onDelete={
          readOnly
            ? undefined
            : (id) => {
                const template = templates.find((item) => item.roleName === id);
                if (template) setDeleteTarget(template);
              }
        }
        detail={
          selected ? (
            <GrantEditor
              title={selected.roleName}
              slug={selected.roleName}
              locked={selected.roleName === "owner"}
              name={selected.roleName}
              nameDisabled
              resources={resources}
              draft={draft}
              onDraft={setDraft}
              readOnly={readOnly}
              saving={saveMutation.isPending}
              onSave={() => saveMutation.mutate()}
              idPrefix={`template-${selected.roleName}`}
            />
          ) : null
        }
      />
      <CreateNameDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        title="Buat Template Role"
        description="Template disalin ke organization_role saat organisasi baru dibuat."
        label="Nama template"
        placeholder="cashier"
        value={roleName}
        onChange={setRoleName}
        pending={createMutation.isPending}
        submitLabel="Buat Template"
        onSubmit={() => createMutation.mutate()}
      />
      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title={`Hapus template "${deleteTarget?.roleName}"?`}
        description="Template ini tidak lagi disalin ke organisasi baru."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.roleName)
        }
      />
    </>
  );
}

function OrganizationRoleWorkspace({
  tenantId,
  readOnly,
  createOpen,
  onCreateOpenChange,
}: {
  tenantId: string;
  readOnly: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["org-catalog", tenantId],
    queryFn: () => listOrganizationCatalog(tenantId),
  });
  const orgsQuery = useQuery({
    queryKey: ["org-rbac-orgs", tenantId],
    queryFn: () =>
      listTenantOrganizations(tenantId, { page: 0, pageSize: 100 }),
  });
  const organizations = orgsQuery.data?.items ?? [];
  const resources = catalogQuery.data?.resources ?? [];
  const [organizationId, setOrganizationId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draft, setDraft] = useState<PermissionMap>({});
  const [deleteTarget, setDeleteTarget] = useState<OrganizationRoleRecord | null>(
    null,
  );
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
  const selected =
    roles.find((role) => role.id === selectedId) ?? roles[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    if (!selectedId) setSelectedId(selected.id);
    setDraftName(selected.role);
    setDraft(structuredClone(selected.permission ?? {}));
  }, [selected, selectedId]);

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["org-roles", tenantId, organizationId],
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Pilih role.");
      return updateOrganizationRole(tenantId, organizationId, selected.id, {
        role: draftName.trim().toLowerCase(),
        permission: draft,
      });
    },
    onSuccess: () => {
      toast.success("Matriks permission berhasil disimpan.");
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
      toast.success(`Role "${created.role}" berhasil dibuat.`);
      setSelectedId(created.id);
      setRoleName("");
      onCreateOpenChange(false);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal membuat role.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) =>
      deleteOrganizationRole(tenantId, organizationId, roleId),
    onSuccess: () => {
      toast.success("Role berhasil dihapus.");
      setSelectedId("");
      setDeleteTarget(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus role.")),
  });

  const available = totalActions(resources);

  return (
    <>
      <QueryError
        title="Gagal Memuat Role Organisasi"
        error={rolesQuery.error ?? catalogQuery.error ?? orgsQuery.error}
      />
      <SplitWorkspace
        title={`Daftar Role (${roles.length})`}
        description="Pilih role organisasi untuk mengatur hak akses per modul."
        empty={
          organizationId
            ? "Organisasi ini belum punya role."
            : "Tenant ini belum punya organisasi."
        }
        listExtra={
          <Select
            value={organizationId}
            onValueChange={(value) => {
              setOrganizationId(value);
              setSelectedId("");
            }}
          >
            <SelectTrigger className="h-9 w-full" size="sm">
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
        }
        items={roles.map((role) => ({
          id: role.id,
          title: role.role,
          description: "Berlaku pada organisasi yang dipilih.",
          meta: role.role,
          countLabel: `${countGrants(role.permission ?? {})}/${available} izin`,
          locked: role.role === "owner",
        }))}
        selectedId={selected?.id ?? ""}
        onSelect={setSelectedId}
        onDelete={
          readOnly
            ? undefined
            : (id) => {
                const role = roles.find((item) => item.id === id);
                if (role && role.role !== "owner") setDeleteTarget(role);
              }
        }
        detail={
          selected ? (
            <GrantEditor
              title={selected.role}
              slug={selected.role}
              locked={selected.role === "owner"}
              name={draftName}
              onName={setDraftName}
              nameDisabled={readOnly || selected.role === "owner"}
              resources={resources}
              draft={draft}
              onDraft={setDraft}
              readOnly={readOnly || selected.role === "owner"}
              saving={saveMutation.isPending}
              onSave={() => saveMutation.mutate()}
              idPrefix={`role-${selected.id}`}
            />
          ) : null
        }
      />
      <CreateNameDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        title="Buat Role Organisasi"
        description="Role kustom langsung berlaku di organisasi yang sedang dipilih."
        label="Nama role"
        placeholder="supervisor"
        value={roleName}
        onChange={setRoleName}
        pending={createMutation.isPending}
        submitLabel="Buat Role"
        onSubmit={() => createMutation.mutate()}
      />
      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title={`Hapus role "${deleteTarget?.role}"?`}
        description="Role kustom ini dihapus dari organisasi yang dipilih."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </>
  );
}

function CatalogWorkspace({
  tenantId,
  readOnly,
  createOpen,
  onCreateOpenChange,
}: {
  tenantId: string;
  readOnly: boolean;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({
    queryKey: ["org-catalog", tenantId],
    queryFn: () => listOrganizationCatalog(tenantId),
  });
  const permissions = catalogQuery.data?.permissions ?? [];
  const resources = catalogQuery.data?.resources ?? [];

  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editing, setEditing] = useState<{
    permission: CatalogPermission;
    resourceDisplayName: string;
    resourceDescription: string;
    actionDisplayName: string;
    actionDescription: string;
  } | null>(null);

  const [createMode, setCreateMode] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState({
    resource: "",
    action: "",
    resourceDisplayName: "",
    actionDisplayName: "",
    actionDescription: "",
  });

  useEffect(() => {
    if (!createOpen) return;
    if (resources.length === 0) {
      setCreateMode("new");
      return;
    }
    if (createMode === "existing" && !form.resource && resources[0]) {
      setForm((prev) => ({
        ...prev,
        resource: resources[0].resource,
        resourceDisplayName: resources[0].displayName,
      }));
    }
  }, [createOpen, createMode, form.resource, resources]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["org-catalog", tenantId] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("Pilih permission.");
      return updateOrganizationPermission(tenantId, editing.permission.id, {
        actionDisplayName: editing.actionDisplayName.trim(),
        actionDescription: editing.actionDescription.trim() || undefined,
        resourceDisplayName: editing.resourceDisplayName.trim(),
        resourceDescription: editing.resourceDescription.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Permission berhasil diperbarui.");
      setEditing(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menyimpan permission.")),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganizationPermission(tenantId, {
        resource: form.resource.trim().toLowerCase(),
        action: form.action.trim().toLowerCase(),
        resourceDisplayName: form.resourceDisplayName.trim(),
        actionDisplayName: form.actionDisplayName.trim(),
        actionDescription: form.actionDescription.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(
        "Permission ditambahkan. Restart API agar Better Auth mengenal resource baru.",
      );
      setForm({
        resource: "",
        action: "",
        resourceDisplayName: "",
        actionDisplayName: "",
        actionDescription: "",
      });
      onCreateOpenChange(false);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menambah permission.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganizationPermission(tenantId, id),
    onSuccess: () => {
      toast.success("Permission berhasil dihapus.");
      setDeleteId(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Gagal menghapus permission.")),
  });

  const resourceMap = new Map(
    resources.map((item) => [item.resource, item]),
  );

  const groupedResources = (() => {
    const groups = new Map<
      string,
      {
        resource: string;
        displayName: string;
        description: string;
        items: Array<{
          permission: CatalogPermission;
          actionDescription: string;
        }>;
      }
    >();

    for (const res of resources) {
      groups.set(res.resource, {
        resource: res.resource,
        displayName: res.displayName,
        description: res.description ?? "",
        items: [],
      });
    }

    for (const permission of permissions) {
      const meta = resourceMap.get(permission.resource);
      const existing = groups.get(permission.resource) ?? {
        resource: permission.resource,
        displayName: meta?.displayName ?? permission.resource,
        description: meta?.description ?? "",
        items: [],
      };
      existing.items.push({
        permission,
        actionDescription: meta?.actions[permission.action]?.description ?? "",
      });
      groups.set(permission.resource, existing);
    }

    return Array.from(groups.values());
  })();

  const query = search.trim().toLowerCase();
  const visibleGroups = groupedResources
    .filter(
      (group) => resourceFilter === "all" || group.resource === resourceFilter,
    )
    .map((group) => {
      if (!query) return group;
      const resourceMatches =
        group.resource.toLowerCase().includes(query) ||
        group.displayName.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query);
      if (resourceMatches) return group;
      return {
        ...group,
        items: group.items.filter(
          ({ permission, actionDescription }) =>
            permission.code.toLowerCase().includes(query) ||
            permission.displayName.toLowerCase().includes(query) ||
            permission.action.toLowerCase().includes(query) ||
            actionDescription.toLowerCase().includes(query),
        ),
      };
    })
    .filter((group) => group.items.length > 0 || (!query && resourceFilter !== "all"));

  const visiblePermissionCount = visibleGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const openGroupValues = visibleGroups
    .map((group) => group.resource)
    .filter((res) => Boolean(query) || !collapsed.includes(res));
  const allExpanded =
    visibleGroups.length > 0 && openGroupValues.length === visibleGroups.length;

  const toggleAllGroups = () => {
    if (allExpanded) {
      setCollapsed(visibleGroups.map((group) => group.resource));
    } else {
      setCollapsed([]);
    }
  };

  const openCreateForResource = (resourceKey: string, displayName: string) => {
    setCreateMode("existing");
    setForm({
      resource: resourceKey,
      action: "",
      resourceDisplayName: displayName,
      actionDisplayName: "",
      actionDescription: "",
    });
    onCreateOpenChange(true);
  };

  const openEditDialog = (
    permission: CatalogPermission,
    actionDescription: string,
  ) => {
    const meta = resourceMap.get(permission.resource);
    setEditing({
      permission,
      resourceDisplayName: meta?.displayName ?? permission.resource,
      resourceDescription: meta?.description ?? "",
      actionDisplayName: permission.displayName,
      actionDescription,
    });
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Kode "${code}" disalin.`);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 1500);
    } catch {
      toast.error("Gagal menyalin kode permission.");
    }
  };

  const deleteTarget = permissions.find((item) => item.id === deleteId) ?? null;
  const previewCode =
    form.resource.trim() && form.action.trim()
      ? `${form.resource.trim().toLowerCase()}:${form.action.trim().toLowerCase()}`
      : null;
  const canCreate =
    Boolean(form.resource.trim()) &&
    Boolean(form.action.trim()) &&
    Boolean(form.resourceDisplayName.trim()) &&
    Boolean(form.actionDisplayName.trim());

  return (
    <div className="space-y-5">
      <QueryError title="Gagal Memuat Katalog" error={catalogQuery.error} />

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari permission, kode (mis. member:create), atau resource..."
                  className="pl-9 pr-8"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Semua Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Semua Resource ({groupedResources.length})
                  </SelectItem>
                  {groupedResources.map((group) => (
                    <SelectItem key={group.resource} value={group.resource}>
                      {group.displayName} ({group.items.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
              <div className="flex items-center gap-2">
                <Badge color="secondary" variant="soft">
                  {visibleGroups.length} resource
                </Badge>
                <Badge color="default" variant="soft">
                  {visiblePermissionCount} permission
                </Badge>
              </div>
              {visibleGroups.length > 1 && !query ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  color="secondary"
                  onClick={toggleAllGroups}
                >
                  {allExpanded ? "Tutup Semua" : "Buka Semua"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {catalogQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Memuat katalog permission...
          </CardContent>
        </Card>
      ) : permissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <KeyRound className="h-8 w-8 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium text-default-900">
                Belum ada permission di katalog
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan resource dan action agar bisa dipilih di template dan
                role organisasi.
              </p>
            </div>
            {readOnly ? null : (
              <Button
                type="button"
                size="sm"
                color="primary"
                onClick={() => onCreateOpenChange(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Permission
              </Button>
            )}
          </CardContent>
        </Card>
      ) : visibleGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium text-default-900">
                Permission tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coba ubah kata kunci pencarian atau pilih filter resource lain.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              color="secondary"
              onClick={() => {
                setSearch("");
                setResourceFilter("all");
              }}
            >
              Reset Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          value={openGroupValues}
          onValueChange={(openValues) => {
            if (query) return;
            setCollapsed(
              visibleGroups
                .map((group) => group.resource)
                .filter((res) => !openValues.includes(res)),
            );
          }}
          className="space-y-3"
        >
          {visibleGroups.map((group) => (
            <AccordionItem
              key={group.resource}
              value={group.resource}
              className="overflow-hidden rounded-lg border border-border bg-card px-4"
            >
              <div className="flex items-center justify-between gap-2">
                <AccordionTrigger className="flex-1 py-4 hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-3 text-left">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-default-900">
                            {group.displayName}
                          </span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {group.resource}
                          </code>
                        </div>
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          {group.description ||
                            "Resource permission organisasi"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      color="secondary"
                      variant="soft"
                      className="shrink-0 text-xs"
                    >
                      {group.items.length} action
                    </Badge>
                  </div>
                </AccordionTrigger>
                {readOnly ? null : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    color="secondary"
                    className="shrink-0"
                    onClick={() =>
                      openCreateForResource(group.resource, group.displayName)
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Action
                  </Button>
                )}
              </div>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map(({ permission, actionDescription }) => (
                    <div
                      key={permission.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-primary/40"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-default-900">
                              {permission.displayName}
                            </div>
                          </div>
                          {readOnly ? null : (
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                color="secondary"
                                className="h-7 w-7"
                                onClick={() =>
                                  openEditDialog(permission, actionDescription)
                                }
                                aria-label={`Edit ${permission.code}`}
                                title="Edit label & deskripsi"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                color="destructive"
                                className="h-7 w-7"
                                onClick={() => setDeleteId(permission.id)}
                                aria-label={`Hapus ${permission.code}`}
                                title="Hapus permission"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {actionDescription ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {actionDescription}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                        <code className="truncate rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {permission.code}
                        </code>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          color="secondary"
                          className="h-6 w-6 shrink-0"
                          onClick={() => void copyCode(permission.code)}
                          aria-label={`Salin kode ${permission.code}`}
                          title="Salin kode"
                        >
                          {copiedCode === permission.code ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Edit Permission
            </DialogTitle>
            <DialogDescription>
              Perbarui label yang tampil di matriks role dan template.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate();
              }}
            >
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Kode Permission</span>
                <code className="font-semibold text-default-900">
                  {editing.permission.code}
                </code>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-perm-resource-label">Nama Resource</Label>
                  <Input
                    id="edit-perm-resource-label"
                    value={editing.resourceDisplayName}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        resourceDisplayName: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-perm-action-label">Nama Action</Label>
                  <Input
                    id="edit-perm-action-label"
                    value={editing.actionDisplayName}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        actionDisplayName: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-perm-resource-desc">
                  Deskripsi Resource{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (opsional)
                  </span>
                </Label>
                <Input
                  id="edit-perm-resource-desc"
                  placeholder="Keterangan singkat tentang resource ini"
                  value={editing.resourceDescription}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      resourceDescription: event.target.value,
                    })
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Nama & deskripsi resource berlaku untuk semua action di{" "}
                  <code>{editing.permission.resource}</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-perm-action-desc">
                  Deskripsi Action{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (opsional)
                  </span>
                </Label>
                <Input
                  id="edit-perm-action-desc"
                  placeholder="Keterangan singkat hak akses action ini"
                  value={editing.actionDescription}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      actionDescription: event.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  color="secondary"
                  onClick={() => setEditing(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={
                    saveMutation.isPending ||
                    !editing.resourceDisplayName.trim() ||
                    !editing.actionDisplayName.trim()
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setForm({
              resource: "",
              action: "",
              resourceDisplayName: "",
              actionDisplayName: "",
              actionDescription: "",
            });
          }
          onCreateOpenChange(open);
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Tambah Permission</DialogTitle>
            <DialogDescription>
              Pilih resource yang sudah ada atau buat resource baru. Kode
              memakai huruf kecil, angka, dan strip.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (canCreate) createMutation.mutate();
            }}
          >
            {resources.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode("existing");
                    const first = resources[0];
                    if (first) {
                      setForm((prev) => ({
                        ...prev,
                        resource: first.resource,
                        resourceDisplayName: first.displayName,
                      }));
                    }
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    createMode === "existing"
                      ? "bg-background text-default-900 shadow-xs"
                      : "text-muted-foreground hover:text-default-900",
                  )}
                >
                  Resource yang Ada
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode("new");
                    setForm((prev) => ({
                      ...prev,
                      resource: "",
                      resourceDisplayName: "",
                    }));
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    createMode === "new"
                      ? "bg-background text-default-900 shadow-xs"
                      : "text-muted-foreground hover:text-default-900",
                  )}
                >
                  Resource Baru
                </button>
              </div>
            ) : null}

            {createMode === "existing" && resources.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="existing-perm-resource">Resource</Label>
                <Select
                  value={form.resource}
                  onValueChange={(value) => {
                    const matched = resourceMap.get(value);
                    setForm((prev) => ({
                      ...prev,
                      resource: value,
                      resourceDisplayName: matched?.displayName ?? value,
                    }));
                  }}
                >
                  <SelectTrigger id="existing-perm-resource">
                    <SelectValue placeholder="Pilih resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map((res) => (
                      <SelectItem key={res.resource} value={res.resource}>
                        {res.displayName} ({res.resource})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NameField
                  id="new-perm-resource"
                  label="Kode Resource"
                  placeholder="report"
                  value={form.resource}
                  onChange={(resource) => setForm({ ...form, resource })}
                />
                <NameField
                  id="new-perm-resource-name"
                  label="Nama Resource"
                  placeholder="Laporan"
                  value={form.resourceDisplayName}
                  onChange={(resourceDisplayName) =>
                    setForm({ ...form, resourceDisplayName })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NameField
                id="new-perm-action"
                label="Kode Action"
                placeholder="export"
                value={form.action}
                onChange={(action) => setForm({ ...form, action })}
              />
              <NameField
                id="new-perm-action-name"
                label="Nama Action"
                placeholder="Ekspor laporan"
                value={form.actionDisplayName}
                onChange={(actionDisplayName) =>
                  setForm({ ...form, actionDisplayName })
                }
              />
            </div>

            <NameField
              id="new-perm-action-desc"
              label="Deskripsi Action (opsional)"
              placeholder="Mengizinkan ekspor laporan ke CSV atau PDF"
              value={form.actionDescription}
              onChange={(actionDescription) =>
                setForm({ ...form, actionDescription })
              }
            />

            {previewCode ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Pratinjau Kode</span>
                <code className="font-semibold text-primary">
                  {previewCode}
                </code>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                color="secondary"
                onClick={() => onCreateOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={createMutation.isPending || !canCreate}
              >
                {createMutation.isPending
                  ? "Menambahkan..."
                  : "Tambah Permission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={Boolean(deleteTarget)}
        title={`Hapus permission "${deleteTarget?.code}"?`}
        description="Kode ini tidak lagi bisa dipilih di template dan role organisasi."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}

function QueryError({ title, error }: { title: string; error: unknown }) {
  if (!error) return null;
  return (
    <Alert color="destructive" variant="soft" className="mb-5">
      <AlertTitle className="text-sm">{title}</AlertTitle>
      <AlertDescription className="text-xs">
        {error instanceof Error ? error.message : "Terjadi kesalahan saat memuat data."}
      </AlertDescription>
    </Alert>
  );
}

function SplitWorkspace({
  title,
  description,
  empty,
  items,
  selectedId,
  onSelect,
  onDelete,
  listExtra,
  detail,
}: {
  title: string;
  description: string;
  empty: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    meta: string;
    countLabel: string;
    locked?: boolean;
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  listExtra?: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardHeader className="mb-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {listExtra ? <div className="pt-3">{listExtra}</div> : null}
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {empty}
            </p>
          ) : (
            items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      onSelect(item.id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3.5 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/8"
                      : "border-border bg-card hover:bg-accent/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-default-900">
                          {item.title}
                        </span>
                        {item.locked ? (
                          <Badge
                            color="secondary"
                            variant="soft"
                            className="text-[10px]"
                          >
                            <Lock className="mr-1 h-2.5 w-2.5" />
                            System
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {onDelete && !item.locked ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        color="destructive"
                        className="h-7 w-7 shrink-0"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(item.id);
                        }}
                        aria-label={`Hapus ${item.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-medium">{item.meta}</span>
                    <span>{item.countLabel}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-8">
        {detail ?? (
          <CardContent className="py-12 text-center text-muted-foreground">
            Pilih item di panel kiri untuk mulai mengedit.
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function GrantEditor({
  title,
  slug,
  locked,
  name,
  onName,
  nameDisabled,
  resources,
  draft,
  onDraft,
  readOnly,
  saving,
  onSave,
  idPrefix,
}: {
  title: string;
  slug: string;
  locked: boolean;
  name: string;
  onName?: (value: string) => void;
  nameDisabled?: boolean;
  resources: CatalogResource[];
  draft: PermissionMap;
  onDraft: (next: PermissionMap) => void;
  readOnly: boolean;
  saving: boolean;
  onSave: () => void;
  idPrefix: string;
}) {
  const available = totalActions(resources);
  const activeCount = countGrants(draft);

  const toggle = (resource: string, action: string, checked: boolean) => {
    const current = new Set(draft[resource] ?? []);
    if (checked) current.add(action);
    else current.delete(action);
    const next = { ...draft };
    const actions = Array.from(current);
    if (actions.length === 0) delete next[resource];
    else next[resource] = actions;
    onDraft(next);
  };

  const selectAll = () => {
    const next: PermissionMap = {};
    for (const resource of resources) {
      next[resource.resource] = Object.keys(resource.actions);
    }
    onDraft(next);
  };

  return (
    <>
      <CardHeader className="mb-0 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {locked ? (
              <Badge color="secondary" variant="soft" className="text-[10px]">
                <Lock className="mr-1 h-2.5 w-2.5" />
                System
              </Badge>
            ) : null}
            <Badge color="default" variant="soft">
              {activeCount}/{available} permissions
            </Badge>
          </div>
          <CardDescription>
            Slug: <span className="text-xs font-medium">{slug}</span>
          </CardDescription>
        </div>
        {readOnly ? null : (
          <Button color="primary" disabled={saving} onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Matriks"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-name`}>Nama Role</Label>
              <Input
                id={`${idPrefix}-name`}
                value={name}
                disabled={nameDisabled}
                onChange={(event) => onName?.(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-slug`}>Slug</Label>
              <Input id={`${idPrefix}-slug`} value={slug} disabled />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Aksi cepat seluruh resource organisasi
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                color="secondary"
                disabled={readOnly}
                onClick={selectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                color="destructive"
                disabled={readOnly}
                onClick={() => onDraft({})}
              >
                Clear All
              </Button>
            </div>
          </div>

          <Accordion
            type="multiple"
            defaultValue={resources.slice(0, 3).map((resource) => resource.resource)}
            className="space-y-3"
          >
            {resources.map((resource) => {
              const actions = Object.entries(resource.actions);
              const checkedActions = draft[resource.resource] ?? [];
              return (
                <AccordionItem
                  key={resource.resource}
                  value={resource.resource}
                  className="rounded-lg border border-border px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between pr-3 text-left">
                      <div>
                        <div className="text-sm font-semibold text-default-900">
                          {resource.displayName}
                        </div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {resource.description || resource.resource}
                        </div>
                      </div>
                      <Badge
                        color={
                          checkedActions.length === actions.length
                            ? "success"
                            : checkedActions.length > 0
                              ? "default"
                              : "secondary"
                        }
                        variant="soft"
                        className="ml-2 shrink-0 font-semiboldums text-xs"
                      >
                        {checkedActions.length} / {actions.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
                      {actions.map(([action, meta]) => {
                        const checkboxId = `${idPrefix}-${resource.resource}-${action}`;
                        const isChecked = checkedActions.includes(action);
                        return (
                          <div
                            key={action}
                            className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={isChecked}
                              disabled={readOnly}
                              onCheckedChange={(value) =>
                                toggle(
                                  resource.resource,
                                  action,
                                  Boolean(value),
                                )
                              }
                            />
                            <Label
                              htmlFor={checkboxId}
                              className="cursor-pointer space-y-0.5 leading-snug"
                            >
                              <div className="text-xs font-semibold text-default-900">
                                {meta.displayName}{" "}
                                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-semiboldums text-[10px] text-muted-foreground">
                                  {resource.resource}:{action}
                                </span>
                              </div>
                              {meta.description ? (
                                <div className="text-[11px] font-normal text-muted-foreground">
                                  {meta.description}
                                </div>
                              ) : null}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </CardContent>
    </>
  );
}

function CreateNameDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  value,
  onChange,
  pending,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <NameField
            id="new-org-role-name"
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              color="secondary"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" color="primary" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NameField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ConfirmDelete({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
