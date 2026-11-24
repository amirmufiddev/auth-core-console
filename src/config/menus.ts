import {
  Activity,
  AppWindow,
  Building2,
  CreditCard,
  Globe,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
} from "lucide-react";
import { type BetterAuthFeatureId } from "@/config/better-auth.config";

export interface MenuItemProps {
  title: string;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  featureId?: BetterAuthFeatureId;
  isHeader?: boolean;
  child?: MenuItemProps[];
  permission?: { resource: string; action: string };
}

export const platformNav: MenuItemProps[] = [
  {
    title: "Overview",
    href: "/platform",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    href: "/platform/tenants",
    icon: Building2,
    permission: { resource: "tenant", action: "read" },
  },
  {
    title: "Feature & Tier Matrix",
    href: "/platform/tiers",
    icon: SlidersHorizontal,
    permission: { resource: "tier", action: "read" },
  },
  {
    title: "Billing Ledger",
    href: "/platform/billing",
    icon: CreditCard,
    permission: { resource: "billing", action: "read" },
  },
  {
    title: "Direktori akun",
    href: "/platform/users",
    icon: Users,
    permission: { resource: "user", action: "read" },
  },
  {
    title: "Staf platform",
    href: "/platform/staff",
    icon: UserCog,
    permission: { resource: "staff", action: "read" },
  },
  {
    title: "Role Platform",
    href: "/platform/roles",
    icon: ShieldCheck,
    permission: { resource: "role", action: "read" },
  },
  {
    title: "Sesi Staf",
    href: "/platform/sessions",
    icon: Activity,
    permission: { resource: "session", action: "read" },
  },
  {
    title: "Audit Platform",
    href: "/platform/audit",
    icon: ScrollText,
    permission: { resource: "auditLog", action: "read" },
  },
  {
    title: "Auth Features",
    href: "/platform/auth-features",
    icon: SlidersHorizontal,
    badge: "Service",
  },
  {
    title: "Akun",
    href: "/platform/account",
    icon: UserCog,
  },
];

export const menusConfig: {
  mainNav: MenuItemProps[];
  sidebarNav: {
    modern: MenuItemProps[];
    classic: MenuItemProps[];
  };
} = {
  mainNav: [
    {
      title: "Platform Console",
      icon: LayoutDashboard,
      child: platformNav,
    },
  ],
  sidebarNav: {
    modern: platformNav,
    classic: platformNav,
  },
};

export const ownerPortalNav: MenuItemProps[] = [
  {
    title: "Tenant Saya",
    href: "/tenants",
    icon: Globe,
  },
];

export function tenantNav(tenantId: string): MenuItemProps[] {
  return [
    {
      title: "Ringkasan",
      href: `/tenants/${tenantId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Pengaturan",
      href: `/tenants/${tenantId}/settings`,
      icon: Settings,
    },
    {
      title: "Fitur IAM",
      href: `/tenants/${tenantId}/features`,
      icon: SlidersHorizontal,
    },
    {
      title: "Aplikasi terhubung",
      href: `/tenants/${tenantId}/oauth-clients`,
      icon: AppWindow,
    },
    {
      title: "API key",
      href: `/tenants/${tenantId}/api-keys`,
      icon: KeyRound,
    },
    {
      title: "Users",
      href: `/tenants/${tenantId}/users`,
      icon: Users,
    },
    {
      title: "Organizations",
      href: `/tenants/${tenantId}/organizations`,
      icon: Building2,
    },
    {
      title: "Billing",
      href: `/tenants/${tenantId}/billing`,
      icon: CreditCard,
    },
    {
      title: "Akun",
      href: `/tenants/${tenantId}/account`,
      icon: UserCog,
    },
  ];
}

export function collectMenuHrefs(items: MenuItemProps[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    if (item.href) hrefs.push(item.href);
    if (item.child?.length) {
      hrefs.push(...collectMenuHrefs(item.child));
    }
  }
  return hrefs;
}