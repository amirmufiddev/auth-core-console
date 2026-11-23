import {
  type BillingRecordStatus,
  type TenantBillingStatus,
  type TenantStatus,
  getTierLabel,
} from "@/api/tenant-service";
import { Badge } from "@/components/ui/badge";

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <Badge color={status === "active" ? "success" : "destructive"} variant="soft">
      {status === "active" ? "Active" : "Suspended"}
    </Badge>
  );
}

const BILLING_STATUS_STYLE: Record<
  TenantBillingStatus,
  { color: string; label: string }
> = {
  active: { color: "success", label: "Active" },
  trialing: { color: "info", label: "Trialing" },
  past_due: { color: "warning", label: "Past Due" },
  suspended: { color: "destructive", label: "Suspended" },
  manual_invoice: { color: "secondary", label: "Manual Invoice" },
};

export function TenantBillingStatusBadge({
  status,
}: {
  status: TenantBillingStatus;
}) {
  const cfg = BILLING_STATUS_STYLE[status] ?? {
    color: "secondary",
    label: status,
  };
  return (
    <Badge color={cfg.color} variant="outline">
      {cfg.label}
    </Badge>
  );
}

const BILLING_RECORD_STYLE: Record<
  BillingRecordStatus,
  { color: string; label: string }
> = {
  paid: { color: "success", label: "Paid" },
  active: { color: "success", label: "Active" },
  trialing: { color: "info", label: "Trialing" },
  past_due: { color: "warning", label: "Past Due" },
  manual_invoice: { color: "secondary", label: "Manual Invoice" },
  void: { color: "destructive", label: "Void" },
};

export function BillingRecordStatusBadge({
  status,
}: {
  status: BillingRecordStatus;
}) {
  const cfg = BILLING_RECORD_STYLE[status] ?? {
    color: "secondary",
    label: status,
  };
  return (
    <Badge color={cfg.color} variant="soft">
      {cfg.label}
    </Badge>
  );
}

const TIER_COLORS: Record<string, string> = {
  tier_free: "secondary",
  tier_basic: "info",
  tier_business: "default",
  tier_enterprise: "tertiary",
};

export function TenantTierBadge({ tierId }: { tierId: string }) {
  return (
    <Badge color={TIER_COLORS[tierId] ?? "secondary"} variant="soft">
      {getTierLabel(tierId)}
    </Badge>
  );
}
