import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { isExternalBackendConfigured } from "@/api/client";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Verifikasi identitas akun Anda (OpenID Connect)",
  profile: "Akses nama dan informasi profil dasar Anda",
  email: "Akses alamat email dan status verifikasi email Anda",
  offline_access: "Pertahankan akses saat Anda tidak sedang aktif (refresh token)",
};

export function ConsentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        clientId: "",
        scope: "",
        consentCode: "",
        rawQuery: "",
      };
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
    async function ensureSession() {
      let currentUser = useAuthStore.getState().user;
      if (!currentUser && isExternalBackendConfigured()) {
        currentUser = await hydrateSession();
      }
      if (!active) return;
      if (!currentUser) {
        const returnUrl =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/consent";
        void navigate({
          to: "/login",
          search: { redirect: returnUrl },
          replace: true,
        });
        return;
      }
      setCheckingSession(false);
    }
    void ensureSession();
    return () => {
      active = false;
    };
  }, [hydrateSession, navigate]);

  async function handleConsent(accept: boolean) {
    setErrorMessage(null);
    setSubmitting(accept ? "approve" : "deny");
    try {
      const res = await authClient.oauth2.consent({
        accept,
        scope: scopes.length > 0 ? scopes.join(" ") : undefined,
        oauth_query: queryParams.rawQuery || undefined,
      });

      if (res.error) {
        const msg =
          res.error.message || "Gagal memproses persetujuan OAuth 2.1.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      const redirectUrl = res.data?.url;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      toast.success(
        accept
          ? "Persetujuan akses diberikan."
          : "Permintaan akses ditolak.",
      );
      void navigate({ to: "/dashboard" });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses persetujuan OAuth 2.1.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(null);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 py-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Memeriksa sesi autentikasi Anda...
        </p>
      </div>
    );
  }

  const hasOAuthParams = Boolean(
    queryParams.clientId || queryParams.consentCode || queryParams.rawQuery,
  );

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              Persetujuan Akses OAuth 2.1
            </CardTitle>
            <CardDescription className="text-xs">
              Masuk sebagai{" "}
              <span className="font-medium text-foreground">
                {user?.email ?? user?.name}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasOAuthParams && (
          <Alert color="warning" variant="soft">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle className="text-sm">
              Parameter OAuth Tidak Lengkap
            </AlertTitle>
            <AlertDescription className="text-xs">
              Halaman ini harus diakses melalui alur otorisasi OAuth 2.1 / OIDC
              yang valid.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert color="destructive" variant="soft">
            <AlertTitle className="text-sm">Gagal Memproses Consent</AlertTitle>
            <AlertDescription className="text-xs">
              {errorMessage}
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
            <ul className="space-y-2 rounded-lg border border-border p-3">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  <div className="space-y-0.5">
                    <Badge
                      color="secondary"
                      variant="soft"
                      className="font-mono text-[11px]"
                    >
                      {scope}
                    </Badge>
                    {SCOPE_DESCRIPTIONS[scope] && (
                      <p className="text-muted-foreground">
                        {SCOPE_DESCRIPTIONS[scope]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              Akses identitas dasar sesuai konfigurasi klien.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {!hasOAuthParams ? (
          <Button variant="outline" color="secondary" asChild className="w-full">
            <Link to="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        ) : (
          <>
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
          </>
        )}
      </CardFooter>
    </Card>
  );
}
