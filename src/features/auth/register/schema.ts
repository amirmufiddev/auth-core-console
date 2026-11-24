import { z } from "zod";
import type { FeatureConfigMap } from "@/config/better-auth.config";

export interface RegisterSchemaOptions {
  minPasswordLength?: number;
  maxPasswordLength?: number;
}

export function resolveEmailPasswordBounds(
  features: FeatureConfigMap | null | undefined,
): RegisterSchemaOptions {
  const settings = features?.emailAndPassword?.settings ?? {};
  const min = Number(settings.minPasswordLength ?? 8);
  const max = Number(settings.maxPasswordLength ?? 128);
  return {
    minPasswordLength: Number.isFinite(min) ? min : 8,
    maxPasswordLength: Number.isFinite(max) ? max : 128,
  };
}

export function buildRegisterSchema(options?: RegisterSchemaOptions) {
  const min = options?.minPasswordLength ?? 8;
  const max = options?.maxPasswordLength ?? 128;
  return z.object({
    name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter"),
    email: z.string().trim().email("Format email tidak valid"),
    username: z.string().optional(),
    password: z
      .string()
      .min(min, `Kata sandi minimal ${min} karakter`)
      .max(max, `Kata sandi maksimal ${max} karakter`),
  });
}

export type RegisterFormValues = z.infer<ReturnType<typeof buildRegisterSchema>>;