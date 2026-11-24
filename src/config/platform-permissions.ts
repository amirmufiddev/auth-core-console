/**
 * Katalog permission platform.
 * Pasangan API: auth-core-api/src/modules/platform-console/constants/platform-permissions.catalog.ts
 * Kunci resource:action harus sama di kedua file.
 */

export type RbacResource =
  | "user"
  | "session"
  | "role"
  | "organization"
  | "apiKey"
  | "oauthClient"
  | "sso"
  | "authConfig"
  | "auditLog";

export interface RbacPermissionOption {
  action: string;
  label: string;
  description: string;
}

export interface RbacResourceModule {
  resource: RbacResource;
  title: string;
  description: string;
  permissions: RbacPermissionOption[];
  shownInPlatformMatrix: boolean;
}

export const RBAC_RESOURCE_MODULES: RbacResourceModule[] = [
  {
    resource: "user",
    title: "Staf platform",
    description: "Kontrol akun pengguna, ban/unban, dan impersonation sesi.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "Read Users",
        description: "Melihat daftar dan profil user",
      },
      {
        action: "create",
        label: "Create Users",
        description: "Membuat akun user baru",
      },
      {
        action: "update",
        label: "Update Users",
        description: "Mengubah profil, password & verifikasi",
      },
      {
        action: "delete",
        label: "Delete Users",
        description: "Menghapus akun user permanen",
      },
      {
        action: "ban",
        label: "Ban / Unban",
        description: "Membekukan atau memulihkan akses user",
      },
      {
        action: "impersonate",
        label: "Impersonate",
        description: "Masuk sebagai user untuk dukungan teknis",
      },
    ],
  },
  {
    resource: "session",
    title: "Sesi staf",
    description: "Visibilitas dan pencabutan sesi aktif perangkat.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "List Sessions",
        description: "Melihat sesi aktif semua perangkat",
      },
      {
        action: "revoke",
        label: "Revoke Sessions",
        description: "Mencabut token sesi secara paksa",
      },
    ],
  },
  {
    resource: "role",
    title: "Role platform",
    description: "Pengaturan definisi role dan matriks permission RBAC.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "Read Roles",
        description: "Melihat daftar role & hak akses",
      },
      {
        action: "create",
        label: "Create Roles",
        description: "Menambahkan role kustom baru",
      },
      {
        action: "update",
        label: "Update Roles",
        description: "Mengubah permission pada role",
      },
      {
        action: "delete",
        label: "Delete Roles",
        description: "Menghapus role kustom",
      },
    ],
  },
  {
    resource: "organization",
    title: "Direktori tenant & billing",
    description:
      "Membuat tenant, mengubah status dan tier, serta membaca ledger tagihan.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "Baca tenant",
        description: "Melihat direktori tenant dan ledger tagihan",
      },
      {
        action: "create",
        label: "Buat tenant",
        description: "Membuat tenant baru",
      },
      {
        action: "update",
        label: "Ubah tenant",
        description: "Menangguhkan, mengaktifkan, mengganti tier, dan mencatat tagihan",
      },
      {
        action: "delete",
        label: "Hapus tenant",
        description: "Menghapus tenant",
      },
    ],
  },
  {
    resource: "apiKey",
    title: "API Keys",
    description: "Penerbitan, pembatasan rate-limit, dan pencabutan API Key.",
    shownInPlatformMatrix: false,
    permissions: [
      {
        action: "read",
        label: "Read Keys",
        description: "Melihat metadata & prefix API key",
      },
      {
        action: "create",
        label: "Create Keys",
        description: "Menerbitkan API key baru",
      },
      {
        action: "update",
        label: "Toggle Keys",
        description: "Mengaktifkan/menonaktifkan API key",
      },
      {
        action: "revoke",
        label: "Revoke Keys",
        description: "Mencabut API key permanen",
      },
    ],
  },
  {
    resource: "oauthClient",
    title: "OAuth 2.1 / OIDC & MCP",
    description:
      "Registrasi aplikasi klien OAuth dan MCP authorization server.",
    shownInPlatformMatrix: false,
    permissions: [
      {
        action: "read",
        label: "Read Clients",
        description: "Melihat OAuth & MCP clients",
      },
      {
        action: "create",
        label: "Register Clients",
        description: "Mendaftarkan client ID/secret",
      },
      {
        action: "update",
        label: "Update Clients",
        description: "Mengubah redirect URI & scopes",
      },
      {
        action: "delete",
        label: "Delete Clients",
        description: "Menghapus client terdaftar",
      },
    ],
  },
  {
    resource: "sso",
    title: "Enterprise SSO & SCIM",
    description: "Konfigurasi SAML 2.0, OIDC IdP, DNS verification & SCIM.",
    shownInPlatformMatrix: false,
    permissions: [
      {
        action: "read",
        label: "Read SSO",
        description: "Melihat provider SAML/OIDC & SCIM",
      },
      {
        action: "configure",
        label: "Configure SSO",
        description: "Menambah/mengubah IdP & mapping SCIM",
      },
      {
        action: "delete",
        label: "Delete SSO",
        description: "Menghapus koneksi SSO",
      },
    ],
  },
  {
    resource: "authConfig",
    title: "Plugin layanan & matriks tier",
    description:
      "Aktivasi/non-aktivasi plugin dan parameter runtime Auth Core.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "Read Config",
        description: "Melihat status plugin Auth Core",
      },
      {
        action: "configure",
        label: "Toggle & Tune",
        description: "Mengaktifkan/mematikan plugin & parameter",
      },
    ],
  },
  {
    resource: "auditLog",
    title: "Audit platform",
    description: "Akses jejak audit autentikasi dan perubahan konfigurasi.",
    shownInPlatformMatrix: true,
    permissions: [
      {
        action: "read",
        label: "Read Audit Logs",
        description: "Membaca stream event audit keamanan",
      },
      {
        action: "export",
        label: "Export Logs",
        description: "Mengekspor log audit ke JSON/CSV",
      },
    ],
  },
];

