import type { ConsoleActor } from "@/lib/console-shell";
import { isPlatformActor } from "@/lib/console-shell";

export const PLATFORM_ONBOARDING_PATH = "/platform/onboarding";

export function needsOwnerOnboarding(actor: ConsoleActor): boolean {
  if (actor.tenantId) return false;
  if (isPlatformActor(actor)) return false;
  return true;
}

export function shouldRedirectToOwnerOnboarding(
  actor: ConsoleActor,
  ownedTenantCount: number,
): boolean {
  return needsOwnerOnboarding(actor) && ownedTenantCount === 0;
}