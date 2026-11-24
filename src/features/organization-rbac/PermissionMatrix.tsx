import type { CatalogResource, PermissionMap } from "@/api/organization-rbac";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function toggleGrant(
  current: PermissionMap,
  resource: string,
  action: string,
  enabled: boolean,
): PermissionMap {
  const next: PermissionMap = {};
  for (const [key, actions] of Object.entries(current)) {
    next[key] = [...actions];
  }
  const actions = new Set(next[resource] ?? []);
  if (enabled) actions.add(action);
  else actions.delete(action);
  if (actions.size === 0) delete next[resource];
  else next[resource] = [...actions];
  return next;
}

export function PermissionMatrix({
  resources,
  value,
  disabled,
  onChange,
}: {
  resources: CatalogResource[];
  value: PermissionMap;
  disabled?: boolean;
  onChange: (next: PermissionMap) => void;
}) {
  if (resources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Katalog permission masih kosong.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => {
        const actions = Object.entries(resource.actions);
        return (
          <section key={resource.resource} className="space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-default-900">
                {resource.displayName}
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground">
                {resource.resource}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {actions.map(([action, meta]) => {
                const id = `${resource.resource}-${action}`;
                const checked = (value[resource.resource] ?? []).includes(
                  action,
                );
                return (
                  <div
                    key={action}
                    className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(next) =>
                        onChange(
                          toggleGrant(
                            value,
                            resource.resource,
                            action,
                            Boolean(next),
                          ),
                        )
                      }
                    />
                    <Label htmlFor={id} className="cursor-pointer space-y-0.5">
                      <span className="block text-sm font-medium">
                        {meta.displayName}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {resource.resource}:{action}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
