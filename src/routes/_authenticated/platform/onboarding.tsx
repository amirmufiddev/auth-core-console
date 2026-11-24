import { createFileRoute } from "@tanstack/react-router";
import { PlatformOnboardingPage } from "@/features/onboarding/PlatformOnboardingPage";

export const Route = createFileRoute("/_authenticated/platform/onboarding")({
  component: PlatformOnboardingPage,
});