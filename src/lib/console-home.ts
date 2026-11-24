import { listMyTenants } from "@/api/tenant-service";
import {
  isPlatformActor,
  resolveConsoleHome,
  toConsoleActor,
} from "@/lib/console-shell";
import {
  PLATFORM_ONBOARDING_PATH,
  needsOwnerOnboarding,
  shouldRedirectToOwnerOnboarding,
} from "@/lib/owner-onboarding";
import { sanitizeRelativeRedirect } from "@/lib/tenant-context";
import { useAuthStore } from "@/stores/useAuthStore";

export async function resolveAuthenticatedHome(): Promise<string> {
  const actor = toConsoleActor(useAuthStore.getState().user);
  if (isPlatformActor(actor)) return "/platform";
  const page = await listMyTenants({ page: 0, pageSize: 2 });
  return resolveConsoleHome({
    actor,
    ownedTenantIds: page.items.map((tenant) => tenant.id),
  });
}

export async function resolvePostAuthRedirect(
  redirectTo?: string,
): Promise<string> {
  if (redirectTo?.trim()) {
    return sanitizeRelativeRedirect(redirectTo);
  }
  const actor = toConsoleActor(useAuthStore.getState().user);
  if (needsOwnerOnboarding(actor)) {
    const page = await listMyTenants({ page: 0, pageSize: 1 });
    if (shouldRedirectToOwnerOnboarding(actor, page.total)) {
      return PLATFORM_ONBOARDING_PATH;
    }
  }
  return resolveAuthenticatedHome();
}