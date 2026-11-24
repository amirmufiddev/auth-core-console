import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { isExternalBackendConfigured } from "@/api/client";
import { authClient } from "@/lib/auth-client";
import { sanitizeRelativeRedirect } from "@/lib/tenant-context";
import { useAuthStore } from "@/stores/useAuthStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AcceptInvitationPage({
  invitationId: propInvitationId,
}: {
  invitationId?: string;
} = {}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    async function ensureSession() {
      let currentUser = useAuthStore.getState().user;
      if (!currentUser && isExternalBackendConfigured()) {
        currentUser = await hydrateSession();
      }
      if (!active) return;
      if (!currentUser) {
        const returnUrl = sanitizeRelativeRedirect(
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/auth/accept-invitation",
        );
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

  async function handleAccept() {
    if (!invitationId) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (res.error) {
        const msg =
          res.error.message || "Gagal menerima undangan organisasi.";
        setErrorMessage(msg);
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
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
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

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">
              Undangan Organisasi
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

        {errorMessage && (
          <Alert color="destructive" variant="soft">
            <AlertTitle className="text-sm">
              Gagal Menerima Undangan
            </AlertTitle>
            <AlertDescription className="text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {accepted ? (
          <Alert color="success" variant="soft">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-sm">Undangan Diterima</AlertTitle>
            <AlertDescription className="text-xs">
              Anda sekarang telah bergabung ke organisasi tersebut.
            </AlertDescription>
          </Alert>
        ) : (
          invitationId && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="text-muted-foreground">ID Undangan</div>
              <div className="font-mono font-semibold text-foreground">
                {invitationId}
              </div>
              <p className="pt-1 text-muted-foreground">
                Klik tombol di bawah untuk menerima undangan dan bergabung ke
                organisasi.
              </p>
            </div>
          )
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {accepted ? (
          <Button color="primary" asChild className="w-full sm:w-auto">
            <Link to="/organizations">Buka Organisasi</Link>
          </Button>
        ) : !invitationId ? (
          <Button
            variant="outline"
            color="secondary"
            asChild
            className="w-full"
          >
            <Link to="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              color="secondary"
              asChild
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              <Link to="/dashboard">Batal</Link>
            </Button>
            <Button
              type="button"
              color="primary"
              disabled={submitting}
              onClick={() => void handleAccept()}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
              )}
              Terima Undangan
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
