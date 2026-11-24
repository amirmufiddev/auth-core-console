import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { isExternalBackendConfigured } from "@/api/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen bg-page-bg text-foreground">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto">
            <ImpersonationBanner />
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    let user = useAuthStore.getState().user;
    if (!user && isExternalBackendConfigured()) {
      user = await useAuthStore.getState().hydrateSession();
    }
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});
