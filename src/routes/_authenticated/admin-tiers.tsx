import { createFileRoute } from "@tanstack/react-router";
import { AdminFeatureTierMatrixPage } from "@/features/admin-tiers/AdminFeatureTierMatrixPage";

export const Route = createFileRoute("/_authenticated/admin-tiers")({
  component: AdminFeatureTierMatrixPage,
});
