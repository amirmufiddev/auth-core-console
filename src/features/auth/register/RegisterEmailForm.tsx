import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildRegisterSchema,
  type RegisterFormValues,
  type RegisterSchemaOptions,
} from "./schema";

export interface RegisterEmailFormProps {
  idPrefix?: string;
  schemaOptions?: RegisterSchemaOptions;
  usernameEnabled?: boolean;
  hibpEnabled?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  passwordPlaceholder?: string;
  onSubmit: (values: RegisterFormValues) => Promise<void>;
}

export function RegisterEmailForm({
  idPrefix = "reg",
  schemaOptions,
  usernameEnabled = false,
  hibpEnabled = false,
  submitLabel = "Daftar Akun",
  submittingLabel = "Mendaftarkan...",
  passwordPlaceholder,
  onSubmit,
}: RegisterEmailFormProps) {
  const schema = buildRegisterSchema(schemaOptions);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", username: "", password: "" },
  });

  const minLen = schemaOptions?.minPasswordLength ?? 8;
  const resolvedPlaceholder =
    passwordPlaceholder ?? `Minimal ${minLen} karakter`;

  const handleSubmit = async (vals: RegisterFormValues) => {
    await onSubmit(vals);
  };

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
      className="space-y-3.5"
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>Nama Lengkap</Label>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="name"
          placeholder="Nama Anda"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="nama@perusahaan.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {usernameEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-username`}>Username</Label>
          <Input
            id={`${idPrefix}-username`}
            autoComplete="username"
            {...form.register("username")}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-password`}>Kata Sandi</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          autoComplete="new-password"
          placeholder={resolvedPlaceholder}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
        {hibpEnabled && (
          <p className="text-[11px] text-muted-foreground">
            Dilindungi pengecekan Have I Been Pwned (k-Anonymity).
          </p>
        )}
      </div>

      <Button
        type="submit"
        color="primary"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        )}
        {form.formState.isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}