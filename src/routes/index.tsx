import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveAuthenticatedHome } from "@/lib/console-home";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = useAuthStore.getState().user;
    if (user) {
      throw redirect({ href: await resolveAuthenticatedHome() });
    }
    throw redirect({ to: "/login" });
  },
});
