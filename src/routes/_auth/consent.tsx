import { createFileRoute } from "@tanstack/react-router";
import { ConsentPage } from "@/features/auth/ConsentPage";

function ConsentRoute() {
  return <ConsentPage />;
}

export const Route = createFileRoute("/_auth/consent")({
  component: ConsentRoute,
});
