import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createTenantAuthClient } from "@/lib/auth-client";
import {
  SUPPORTED_TENANT_SOCIAL_BRIDGE_PROVIDERS,
  type TenantAccessMode,
  type TenantAuthConfigResponse,
  type TenantContextInfo,
  fetchTenantAuthConfig,
  getTenantSocialBridgeStartUrl,
  isTenantFeatureActive,
  sanitizeOAuthRedirectUrl,
  sanitizeRelativeRedirect,
} from "@/lib/tenant-context";
import { SOCIAL_PROVIDER_CATALOG } from "@/components/better-auth/auth/ProviderButtons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantAuthLayout } from "./TenantAuthLayout";

interface BaseTenantPageProps {
  tenantSlug: string;
  mode?: TenantAccessMode;
  redirectTo?: string;
  embedded?: boolean;
  invitationId?: string;
}

function buildTenantRoutePath(
  context: TenantContextInfo,
  page: "login" | "register" | "verify-2fa" | "consent" | "accept-invitation",
): string {
  if (context.mode === "path" && context.tenantSlug) {
    return `/t/${encodeURIComponent(context.tenantSlug)}/${page}`;
  }
  if (page === "accept-invitation") {
    return "/auth/accept-invitation";
  }
  return `/${page}`;
}

interface TenantSessionSnapshot {
  user: {
    id: string;
    name?: string | null;
    email: string;
    tenantId?: string | null;
  };
  session?: {
    activeOrganizationId?: string | null;
  } | null;
}

function useTenantAuthSetup(tenantSlug: string, mode: TenantAccessMode = "path") {
  const context = useMemo<TenantContextInfo>(
    () => ({ mode, tenantSlug }),
    [mode, tenantSlug],
  );

  const tenantClient = useMemo(
    () => createTenantAuthClient(tenantSlug, mode),
    [tenantSlug, mode],
  );

  const [config, setConfig] = useState<TenantAuthConfigResponse | null>(null);
  const [activeSession, setActiveSession] =
    useState<TenantSessionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await tenantClient.getSession();
      const data = res?.data as TenantSessionSnapshot | null | undefined;
      setActiveSession(data?.user ? data : null);
    } catch {
      setActiveSession(null);
    }
  }, [tenantClient]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([
        fetchTenantAuthConfig(context),
        refreshSession(),
      ]);
      setConfig(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat konfigurasi autentikasi tenant.",
      );
    } finally {
      setLoading(false);
    }
  }, [context, refreshSession]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  return {
    context,
    tenantClient,
    config,
    activeSession,
    setActiveSession,
    refreshSession,
    loading,
    error,
    reload: loadConfig,
  };
}

function TenantConfigState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">
          Memuat konfigurasi autentikasi tenant...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 py-4">
        <Alert color="destructive" variant="soft">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="text-sm">Tenant Tidak Tersedia</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          color="secondary"
          className="w-full"
          onClick={onRetry}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return null;
}

function navigateAfterAuth(redirectTo?: string) {
  window.location.assign(sanitizeRelativeRedirect(redirectTo));
}

function renderTenantShell({
  embedded,
  tenantSlug,
  title,
  subtitle,
  children,
}: {
  embedded?: boolean;
  tenantSlug: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  if (embedded) {
    return (
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <Badge color="secondary" variant="soft" className="font-mono text-xs">
            {tenantSlug}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <TenantAuthLayout tenantSlug={tenantSlug} title={title} subtitle={subtitle}>
      {children}
    </TenantAuthLayout>
  );
}

export function TenantLoginPage({
  tenantSlug,
  mode = "path",
  redirectTo,
  embedded = false,
}: BaseTenantPageProps) {
  const navigate = useNavigate();
  const {
    context,
    tenantClient,
    config,
    activeSession,
    setActiveSession,
    refreshSession,
    loading,
    error,
    reload,
  } = useTenantAuthSetup(tenantSlug, mode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailEnabled = isTenantFeatureActive(config, "emailAndPassword");
  const emailOtpEnabled = isTenantFeatureActive(config, "emailOTP");
  const magicLinkEnabled = isTenantFeatureActive(config, "magicLink");
  const passkeyEnabled = isTenantFeatureActive(config, "passkey");
  const activeSocials = useMemo(
    () =>
      SOCIAL_PROVIDER_CATALOG.filter(
        (s) =>
          SUPPORTED_TENANT_SOCIAL_BRIDGE_PROVIDERS.has(s.provider) &&
          isTenantFeatureActive(config, s.id),
      ),
    [config],
  );

  const defaultTab = emailEnabled
    ? "password"
    : emailOtpEnabled
      ? "otp"
      : magicLinkEnabled
        ? "magic"
        : "password";

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await tenantClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (res.error) {
        toast.error(res.error.message || "Email atau kata sandi salah.");
        return;
      }
      const data = res.data as { twoFactorRedirect?: boolean } | null;
      if (data?.twoFactorRedirect) {
        const verifyPath = buildTenantRoutePath(context, "verify-2fa");
        void navigate({
          to: verifyPath as never,
          search: (redirectTo
            ? { redirect: sanitizeRelativeRedirect(redirectTo) }
            : {}) as never,
        });
        return;
      }
      toast.success("Berhasil masuk.");
      if (redirectTo && redirectTo.trim().length > 0) {
        navigateAfterAuth(redirectTo);
        return;
      }
      await refreshSession();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal masuk ke akun tenant.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await tenantClient.emailOtp.sendVerificationOtp({
        email: otpEmail.trim(),
        type: "sign-in",
      });
      if (res.error) {
        toast.error(res.error.message || "Gagal mengirim kode OTP.");
        return;
      }
      setOtpSent(true);
      toast.success("Kode OTP telah dikirim ke email Anda.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengirim kode OTP.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await tenantClient.signIn.emailOtp({
        email: otpEmail.trim(),
        otp: otpCode.trim(),
      });
      if (res.error) {
        toast.error(res.error.message || "Kode OTP tidak valid.");
        return;
      }
      toast.success("Berhasil masuk dengan OTP.");
      if (redirectTo && redirectTo.trim().length > 0) {
        navigateAfterAuth(redirectTo);
        return;
      }
      await refreshSession();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memverifikasi OTP.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const safeRedirect =
        redirectTo && redirectTo.trim().length > 0
          ? sanitizeRelativeRedirect(redirectTo)
          : context.mode === "path" && context.tenantSlug
            ? buildTenantRoutePath(context, "login")
            : "/";
      const callbackURL = `${window.location.origin}${safeRedirect}`;
      const res = await tenantClient.signIn.magicLink({
        email: magicEmail.trim(),
        callbackURL,
      });
      if (res.error) {
        toast.error(res.error.message || "Gagal mengirim Magic Link.");
        return;
      }
      setMagicSent(true);
      toast.success("Tautan masuk telah dikirim ke email Anda.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengirim Magic Link.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasskeySignIn() {
    setSubmitting(true);
    try {
      const res = await tenantClient.signIn.passkey();
      if (res?.error) {
        toast.error(res.error.message || "Autentikasi Passkey gagal.");
        return;
      }
      toast.success("Berhasil masuk dengan Passkey.");
      if (redirectTo && redirectTo.trim().length > 0) {
        navigateAfterAuth(redirectTo);
        return;
      }
      await refreshSession();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Autentikasi Passkey gagal.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSocialSignIn(provider: string) {
    const startUrl = getTenantSocialBridgeStartUrl(
      context,
      provider,
      redirectTo,
    );
    window.location.assign(startUrl);
  }

  async function handleTenantSignOut() {
    setSubmitting(true);
    try {
      await tenantClient.signOut();
      setActiveSession(null);
      toast.success("Berhasil keluar dari sesi tenant.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal keluar dari sesi tenant.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasPrimaryTabs = emailEnabled || emailOtpEnabled || magicLinkEnabled;
  const hasAlternatives = passkeyEnabled || activeSocials.length > 0;

  const content = (
    <div className="w-full space-y-5">
      {loading || error ? (
        <TenantConfigState loading={loading} error={error} onRetry={reload} />
      ) : activeSession ? (
        <div className="space-y-4">
          <Alert color="success" variant="soft">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-sm">Sesi Tenant Aktif</AlertTitle>
            <AlertDescription className="text-xs">
              Anda masuk sebagai{" "}
              <span className="font-semibold">
                {activeSession.user.name || activeSession.user.email}
              </span>{" "}
              ({activeSession.user.email}) pada tenant{" "}
              <span className="font-mono font-semibold">{tenantSlug}</span>.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-foreground">
                {activeSession.user.id}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Tenant ID</span>
              <span className="font-mono text-foreground">
                {activeSession.user.tenantId ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Active Organization</span>
              <span className="font-mono text-foreground">
                {activeSession.session?.activeOrganizationId ?? "Belum dipilih"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            color="destructive"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleTenantSignOut()}
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-1.5 h-4 w-4" />
            )}
            Keluar dari Sesi Tenant
          </Button>
        </div>
      ) : (
        <>
          {hasPrimaryTabs && (
            <Tabs defaultValue={defaultTab} className="w-full">
              {(emailEnabled ? 1 : 0) +
                (emailOtpEnabled ? 1 : 0) +
                (magicLinkEnabled ? 1 : 0) >
                1 && (
                <TabsList className="flex w-full">
                  {emailEnabled && (
                    <TabsTrigger value="password" className="flex-1">
                      Password
                    </TabsTrigger>
                  )}
                  {emailOtpEnabled && (
                    <TabsTrigger value="otp" className="flex-1">
                      Email OTP
                    </TabsTrigger>
                  )}
                  {magicLinkEnabled && (
                    <TabsTrigger value="magic" className="flex-1">
                      Magic Link
                    </TabsTrigger>
                  )}
                </TabsList>
              )}

              {emailEnabled && (
                <TabsContent value="password" className="pt-2">
                  <form
                    onSubmit={(e) => void handlePasswordSignIn(e)}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="tenant-login-email">Email</Label>
                      <Input
                        id="tenant-login-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="nama@perusahaan.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tenant-login-password">Kata Sandi</Label>
                      <Input
                        id="tenant-login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      color="primary"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      )}
                      Masuk
                    </Button>
                  </form>
                </TabsContent>
              )}

              {emailOtpEnabled && (
                <TabsContent value="otp" className="pt-2">
                  {!otpSent ? (
                    <form
                      onSubmit={(e) => void handleSendOtp(e)}
                      className="space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="tenant-otp-email">Email</Label>
                        <Input
                          id="tenant-otp-email"
                          type="email"
                          required
                          placeholder="nama@perusahaan.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        color="primary"
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-1.5 h-4 w-4" />
                        )}
                        Kirim Kode OTP
                      </Button>
                    </form>
                  ) : (
                    <form
                      onSubmit={(e) => void handleVerifyOtp(e)}
                      className="space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="tenant-otp-code">Kode OTP</Label>
                        <Input
                          id="tenant-otp-code"
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        color="primary"
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting && (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        )}
                        Verifikasi &amp; Masuk
                      </Button>
                    </form>
                  )}
                </TabsContent>
              )}

              {magicLinkEnabled && (
                <TabsContent value="magic" className="pt-2">
                  {magicSent ? (
                    <Alert color="success" variant="soft">
                      <MailCheck className="h-4 w-4" />
                      <AlertTitle className="text-sm">
                        Tautan Terkirim
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        Periksa kotak masuk{" "}
                        <span className="font-medium">{magicEmail}</span> untuk
                        melanjutkan proses masuk.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form
                      onSubmit={(e) => void handleMagicLink(e)}
                      className="space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="tenant-magic-email">Email</Label>
                        <Input
                          id="tenant-magic-email"
                          type="email"
                          required
                          placeholder="nama@perusahaan.com"
                          value={magicEmail}
                          onChange={(e) => setMagicEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        color="primary"
                        className="w-full"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-4 w-4" />
                        )}
                        Kirim Magic Link
                      </Button>
                    </form>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}

          {!hasPrimaryTabs && !hasAlternatives && (
            <Alert color="warning" variant="soft">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">
                Tidak Ada Metode Login Aktif
              </AlertTitle>
              <AlertDescription className="text-xs">
                Administrator tenant belum mengaktifkan metode autentikasi apa
                pun.
              </AlertDescription>
            </Alert>
          )}

          {hasPrimaryTabs && hasAlternatives && (
            <div className="relative flex items-center py-1">
              <Separator className="flex-1" />
              <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                atau lanjutkan dengan
              </span>
              <Separator className="flex-1" />
            </div>
          )}

          {hasAlternatives && (
            <div className="space-y-2">
              {passkeyEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  color="secondary"
                  className="w-full"
                  disabled={submitting}
                  onClick={() => void handlePasskeySignIn()}
                >
                  <Fingerprint className="mr-2 h-4 w-4 text-primary" />
                  Masuk dengan Passkey
                </Button>
              )}

              {activeSocials.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {activeSocials.map((social) => (
                    <Button
                      key={social.id}
                      type="button"
                      variant="outline"
                      color="secondary"
                      className="w-full"
                      disabled={submitting}
                      onClick={() => handleSocialSignIn(social.provider)}
                    >
                      <Icon icon={social.icon} className="mr-2 h-4 w-4" />
                      {social.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {emailEnabled && (
            <p className="text-center text-xs text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                to={buildTenantRoutePath(context, "register") as never}
                search={(redirectTo
                  ? { redirect: sanitizeRelativeRedirect(redirectTo) }
                  : {}) as never}
                className="font-semibold text-primary hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1 text-center">
          <Badge color="secondary" variant="soft" className="font-mono text-xs">
            {tenantSlug}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Masuk ke {tenantSlug}
          </h1>
          <p className="text-xs text-muted-foreground">
            Gunakan metode autentikasi yang tersedia untuk tenant ini.
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <TenantAuthLayout
      tenantSlug={tenantSlug}
      title={`Masuk ke ${tenantSlug}`}
      subtitle="Gunakan metode autentikasi yang tersedia untuk tenant ini."
    >
      {content}
    </TenantAuthLayout>
  );
}

export function TenantRegisterPage({
  tenantSlug,
  mode = "path",
  redirectTo,
  embedded = false,
}: BaseTenantPageProps) {
  const navigate = useNavigate();
  const { context, tenantClient, config, loading, error, reload } =
    useTenantAuthSetup(tenantSlug, mode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailEnabled = isTenantFeatureActive(config, "emailAndPassword");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await tenantClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (res.error) {
        toast.error(res.error.message || "Gagal mendaftarkan akun.");
        return;
      }
      toast.success("Akun berhasil dibuat.");
      if (redirectTo && redirectTo.trim().length > 0) {
        navigateAfterAuth(redirectTo);
        return;
      }
      void navigate({ to: buildTenantRoutePath(context, "login") as never });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mendaftarkan akun.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return renderTenantShell({
    embedded,
    tenantSlug,
    title: `Daftar di ${tenantSlug}`,
    subtitle: "Buat akun baru untuk mengakses layanan tenant ini.",
    children: (
      <>
      {loading || error ? (
        <TenantConfigState loading={loading} error={error} onRetry={reload} />
      ) : !emailEnabled ? (
        <div className="space-y-4">
          <Alert color="warning" variant="soft">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="text-sm">
              Pendaftaran Email Dinonaktifkan
            </AlertTitle>
            <AlertDescription className="text-xs">
              Tenant ini tidak mengaktifkan pendaftaran dengan Email &amp; Kata
              Sandi. Silakan masuk menggunakan metode lain yang tersedia.
            </AlertDescription>
          </Alert>
          <Button variant="outline" color="secondary" asChild className="w-full">
            <Link
              to={buildTenantRoutePath(context, "login") as never}
              search={(redirectTo
                ? { redirect: sanitizeRelativeRedirect(redirectTo) }
                : {}) as never}
            >
              Kembali ke Halaman Masuk
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <form
            onSubmit={(e) => void handleRegister(e)}
            className="space-y-3.5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenant-reg-name">Nama Lengkap</Label>
              <Input
                id="tenant-reg-name"
                type="text"
                required
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant-reg-email">Email</Label>
              <Input
                id="tenant-reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenant-reg-password">Kata Sandi</Label>
              <Input
                id="tenant-reg-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              color="primary"
              className="w-full"
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Buat Akun
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Sudah memiliki akun?{" "}
            <Link
              to={buildTenantRoutePath(context, "login") as never}
              search={(redirectTo
                ? { redirect: sanitizeRelativeRedirect(redirectTo) }
                : {}) as never}
              className="font-semibold text-primary hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      )}
      </>
    ),
  });
}

export function TenantVerify2FAPage({
  tenantSlug,
  mode = "path",
  redirectTo,
  embedded = false,
}: BaseTenantPageProps) {
  const navigate = useNavigate();
  const { context, tenantClient, config, loading, error, reload } =
    useTenantAuthSetup(tenantSlug, mode);

  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const twoFactorEnabled = isTenantFeatureActive(config, "twoFactor");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = useBackup
        ? await tenantClient.twoFactor.verifyBackupCode({
            code: code.trim(),
          })
        : await tenantClient.twoFactor.verifyTotp({
            code: code.trim(),
            trustDevice,
          });

      if (res.error) {
        toast.error(res.error.message || "Kode verifikasi 2FA tidak valid.");
        return;
      }
      toast.success("Verifikasi 2FA berhasil.");
      if (redirectTo && redirectTo.trim().length > 0) {
        navigateAfterAuth(redirectTo);
        return;
      }
      void navigate({ to: buildTenantRoutePath(context, "login") as never });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memverifikasi kode 2FA.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return renderTenantShell({
    embedded,
    tenantSlug,
    title: "Verifikasi Dua Faktor (2FA)",
    subtitle: "Masukkan kode autentikator atau backup code untuk melanjutkan.",
    children: (
      <>
      {loading || error ? (
        <TenantConfigState loading={loading} error={error} onRetry={reload} />
      ) : !twoFactorEnabled ? (
        <div className="space-y-4">
          <Alert color="warning" variant="soft">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="text-sm">2FA Tidak Aktif</AlertTitle>
            <AlertDescription className="text-xs">
              Fitur Two-Factor Authentication tidak diaktifkan pada tenant ini.
            </AlertDescription>
          </Alert>
          <Button variant="outline" color="secondary" asChild className="w-full">
            <Link
              to={buildTenantRoutePath(context, "login") as never}
              search={(redirectTo
                ? { redirect: sanitizeRelativeRedirect(redirectTo) }
                : {}) as never}
            >
              Kembali ke Halaman Masuk
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tenant-2fa-code">
              {useBackup ? "Backup Code" : "Kode TOTP (6 digit)"}
            </Label>
            <Input
              id="tenant-2fa-code"
              type="text"
              required
              placeholder={useBackup ? "xxxx-xxxx" : "123456"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {!useBackup && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="tenant-2fa-trust"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(Boolean(checked))}
              />
              <Label
                htmlFor="tenant-2fa-trust"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Percayai perangkat ini selama 30 hari
              </Label>
            </div>
          )}

          <Button
            type="submit"
            color="primary"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-1.5 h-4 w-4" />
            )}
            Verifikasi
          </Button>

          <Button
            type="button"
            variant="ghost"
            color="secondary"
            className="w-full text-xs"
            onClick={() => {
              setUseBackup((prev) => !prev);
              setCode("");
            }}
          >
            {useBackup
              ? "Gunakan kode aplikasi autentikator"
              : "Gunakan backup code"}
          </Button>
        </form>
      )}
      </>
    ),
  });
}

export function TenantConsentPage({
  tenantSlug,
  mode = "path",
  embedded = false,
}: BaseTenantPageProps) {
  const navigate = useNavigate();
  const { context, tenantClient, loading, error, reload } = useTenantAuthSetup(
    tenantSlug,
    mode,
  );

  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    if (typeof window === "undefined") {
      return { clientId: "", scope: "", consentCode: "", rawQuery: "" };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      clientId: params.get("client_id") ?? "",
      scope: params.get("scope") ?? "",
      consentCode: params.get("consent_code") ?? "",
      rawQuery: window.location.search.replace(/^\?/, ""),
    };
  }, []);

  const scopes = useMemo(
    () =>
      queryParams.scope
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [queryParams.scope],
  );

  useEffect(() => {
    let active = true;
    async function checkSession() {
      const returnUrl = sanitizeRelativeRedirect(
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : buildTenantRoutePath(context, "consent"),
      );
      try {
        const res = await tenantClient.getSession();
        if (!active) return;
        const sessionUser = res.data?.user;
        if (!sessionUser) {
          void navigate({
            to: buildTenantRoutePath(context, "login") as never,
            search: { redirect: returnUrl } as never,
            replace: true,
          });
          return;
        }
        setUserEmail(sessionUser.email ?? sessionUser.name ?? null);
      } catch {
        if (!active) return;
        void navigate({
          to: buildTenantRoutePath(context, "login") as never,
          search: { redirect: returnUrl } as never,
          replace: true,
        });
        return;
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      active = false;
    };
  }, [context, navigate, tenantClient]);

  async function handleConsent(accept: boolean) {
    setConsentError(null);
    setSubmitting(accept ? "approve" : "deny");
    try {
      const res = await tenantClient.oauth2.consent({
        accept,
        scope: scopes.length > 0 ? scopes.join(" ") : undefined,
        oauth_query: queryParams.rawQuery || undefined,
      });
      if (res.error) {
        const msg =
          res.error.message || "Gagal memproses persetujuan OAuth 2.1.";
        setConsentError(msg);
        toast.error(msg);
        return;
      }
      const redirectUrl = res.data?.url;
      if (redirectUrl) {
        const safeUrl = sanitizeOAuthRedirectUrl(redirectUrl);
        if (!safeUrl) {
          const msg = "URL redirect OAuth tidak valid atau tidak aman.";
          setConsentError(msg);
          toast.error(msg);
          return;
        }
        window.location.assign(safeUrl);
        return;
      }
      toast.success(
        accept ? "Persetujuan akses diberikan." : "Permintaan akses ditolak.",
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses persetujuan OAuth 2.1.";
      setConsentError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  }

  const hasOAuthParams = Boolean(
    queryParams.clientId || queryParams.consentCode || queryParams.rawQuery,
  );

  return renderTenantShell({
    embedded,
    tenantSlug,
    title: "Persetujuan Akses OAuth 2.1",
    subtitle: userEmail
      ? `Masuk sebagai ${userEmail}`
      : "Otorisasi aplikasi klien",
    children: (
      <>
      {loading || error ? (
        <TenantConfigState loading={loading} error={error} onRetry={reload} />
      ) : checkingSession ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Memeriksa sesi autentikasi Anda...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {!hasOAuthParams && (
            <Alert color="warning" variant="soft">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">
                Parameter OAuth Tidak Lengkap
              </AlertTitle>
              <AlertDescription className="text-xs">
                Halaman ini harus diakses melalui alur otorisasi OAuth 2.1 /
                OIDC yang valid.
              </AlertDescription>
            </Alert>
          )}

          {consentError && (
            <Alert color="destructive" variant="soft">
              <AlertTitle className="text-sm">
                Gagal Memproses Consent
              </AlertTitle>
              <AlertDescription className="text-xs">
                {consentError}
              </AlertDescription>
            </Alert>
          )}

          {queryParams.clientId && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="text-muted-foreground">Aplikasi Pemohon</div>
              <div className="mt-1 font-mono font-semibold text-foreground">
                {queryParams.clientId}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">
              Izin (Scopes) yang Diminta:
            </div>
            {scopes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-3">
                {scopes.map((scope) => (
                  <Badge
                    key={scope}
                    color="secondary"
                    variant="soft"
                    className="font-mono text-[11px]"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3 text-success" />
                    {scope}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                Akses identitas dasar sesuai konfigurasi klien.
              </p>
            )}
          </div>

          {hasOAuthParams && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                color="secondary"
                disabled={submitting !== null}
                onClick={() => void handleConsent(false)}
                className="w-full sm:w-auto"
              >
                {submitting === "deny" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-1.5 h-4 w-4" />
                )}
                Tolak
              </Button>
              <Button
                type="button"
                color="primary"
                disabled={submitting !== null}
                onClick={() => void handleConsent(true)}
                className="w-full sm:w-auto"
              >
                {submitting === "approve" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Izinkan Akses
              </Button>
            </div>
          )}
        </div>
      )}
      </>
    ),
  });
}

export function TenantAcceptInvitationPage({
  tenantSlug,
  mode = "path",
  embedded = false,
  invitationId: propInvitationId,
}: BaseTenantPageProps) {
  const navigate = useNavigate();
  const { context, tenantClient, loading, error, reload } = useTenantAuthSetup(
    tenantSlug,
    mode,
  );

  const [checkingSession, setCheckingSession] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const invitationId = useMemo(() => {
    const queryInviteId =
      typeof window !== "undefined"
        ? (() => {
            const params = new URLSearchParams(window.location.search);
            return (
              params.get("invitationId") ??
              params.get("id") ??
              params.get("token") ??
              ""
            );
          })()
        : "";
    return (queryInviteId || propInvitationId || "").trim();
  }, [propInvitationId]);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      const returnUrl = sanitizeRelativeRedirect(
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : buildTenantRoutePath(context, "accept-invitation"),
      );
      try {
        const res = await tenantClient.getSession();
        if (!active) return;
        const sessionUser = res.data?.user;
        if (!sessionUser) {
          void navigate({
            to: buildTenantRoutePath(context, "login") as never,
            search: { redirect: returnUrl } as never,
            replace: true,
          });
          return;
        }
        setUserEmail(sessionUser.email ?? sessionUser.name ?? null);
      } catch {
        if (!active) return;
        void navigate({
          to: buildTenantRoutePath(context, "login") as never,
          search: { redirect: returnUrl } as never,
          replace: true,
        });
        return;
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      active = false;
    };
  }, [context, navigate, tenantClient]);

  async function handleAccept() {
    if (!invitationId) return;
    setInviteError(null);
    setSubmitting(true);
    try {
      const res = await tenantClient.organization.acceptInvitation({
        invitationId,
      });
      if (res.error) {
        const msg =
          res.error.message || "Gagal menerima undangan organisasi.";
        setInviteError(msg);
        toast.error(msg);
        return;
      }
      setAccepted(true);
      toast.success("Undangan organisasi berhasil diterima.");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menerima undangan organisasi.";
      setInviteError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return renderTenantShell({
    embedded,
    tenantSlug,
    title: "Undangan Organisasi",
    subtitle: userEmail
      ? `Masuk sebagai ${userEmail}`
      : "Konfirmasi keanggotaan organisasi",
    children: (
      <>
      {loading || error ? (
        <TenantConfigState loading={loading} error={error} onRetry={reload} />
      ) : checkingSession ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">
            Memeriksa sesi autentikasi Anda...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {!invitationId && (
            <Alert color="warning" variant="soft">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">
                ID Undangan Tidak Ditemukan
              </AlertTitle>
              <AlertDescription className="text-xs">
                Tautan undangan tidak menyertakan parameter{" "}
                <span className="font-mono">invitationId</span> yang valid.
              </AlertDescription>
            </Alert>
          )}

          {inviteError && (
            <Alert color="destructive" variant="soft">
              <AlertTitle className="text-sm">
                Gagal Menerima Undangan
              </AlertTitle>
              <AlertDescription className="text-xs">
                {inviteError}
              </AlertDescription>
            </Alert>
          )}

          {accepted ? (
            <Alert color="success" variant="soft">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-sm">Undangan Diterima</AlertTitle>
              <AlertDescription className="text-xs">
                Anda sekarang telah bergabung ke organisasi pada tenant{" "}
                <span className="font-mono font-semibold">{tenantSlug}</span>.
              </AlertDescription>
            </Alert>
          ) : (
            invitationId && (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  <div className="text-muted-foreground">ID Undangan</div>
                  <div className="mt-1 font-mono font-semibold text-foreground">
                    {invitationId}
                  </div>
                </div>
                <Button
                  type="button"
                  color="primary"
                  className="w-full"
                  disabled={submitting}
                  onClick={() => void handleAccept()}
                >
                  {submitting ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  )}
                  Terima Undangan
                </Button>
              </div>
            )
          )}
        </div>
      )}
      </>
    ),
  });
}
