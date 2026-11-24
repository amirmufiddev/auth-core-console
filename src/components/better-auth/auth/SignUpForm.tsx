import { resolvePostAuthRedirect } from "@/lib/console-home";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthUI } from "@/components/better-auth/auth-ui-provider";
import { RegisterEmailForm } from "@/features/auth/register/RegisterEmailForm";
import {
  resolveEmailPasswordBounds,
  type RegisterFormValues,
} from "@/features/auth/register/schema";
import { toast } from "sonner";

export function SignUpForm({
  redirectTo,
}: {
  redirectTo?: string;
}) {
  const { features, navigate } = useAuthUI();
  const signUp = useAuthStore((s) => s.signUp);

  const usernameEnabled = Boolean(features.username?.enabled);
  const hibpEnabled = Boolean(features.haveIBeenPwned?.enabled);
  const schemaOptions = resolveEmailPasswordBounds(features);

  const onSubmit = async (vals: RegisterFormValues) => {
    try {
      await signUp({
        name: vals.name,
        email: vals.email,
        username: vals.username,
        password: vals.password,
      });
      toast.success("Akun berhasil dibuat!");
      navigate(await resolvePostAuthRedirect(redirectTo));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registrasi gagal.");
    }
  };

  return (
    <RegisterEmailForm
      idPrefix="ba-signup"
      schemaOptions={schemaOptions}
      usernameEnabled={usernameEnabled}
      hibpEnabled={hibpEnabled}
      onSubmit={onSubmit}
    />
  );
}