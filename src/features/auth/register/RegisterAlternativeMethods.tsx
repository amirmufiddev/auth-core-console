import { Icon } from "@iconify/react";
import { Fingerprint } from "lucide-react";
import type { BetterAuthFeatureId } from "@/config/better-auth.config";
import { PasskeyButton } from "@/components/better-auth/auth/PasskeyButton";
import {
  ProviderButtons,
  SOCIAL_PROVIDER_CATALOG,
} from "@/components/better-auth/auth/ProviderButtons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface PlatformRegisterAlternativesProps {
  variant: "platform";
  redirectTo?: string;
  emailEnabled: boolean;
  passkeyEnabled: boolean;
  socialFeatureEnabled: (id: BetterAuthFeatureId) => boolean;
  hasOneTap?: boolean;
  hasSiwe?: boolean;
  hasAnonymous?: boolean;
}

export interface TenantSocialOption {
  id: BetterAuthFeatureId;
  provider: string;
  label: string;
  icon: string;
}

export interface TenantRegisterAlternativesProps {
  variant: "tenant";
  emailEnabled: boolean;
  passkeyEnabled: boolean;
  activeSocials: TenantSocialOption[];
  disabled?: boolean;
  onPasskey: () => void;
  onSocial: (provider: string) => void;
  passkeyLabel?: string;
}

export type RegisterAlternativeMethodsProps =
  | PlatformRegisterAlternativesProps
  | TenantRegisterAlternativesProps;

function platformHasAlternatives(props: PlatformRegisterAlternativesProps) {
  return (
    props.passkeyEnabled ||
    Boolean(props.hasOneTap) ||
    Boolean(props.hasSiwe) ||
    Boolean(props.hasAnonymous) ||
    SOCIAL_PROVIDER_CATALOG.some((s) => props.socialFeatureEnabled(s.id))
  );
}

export function RegisterAlternativeMethods(
  props: RegisterAlternativeMethodsProps,
) {
  if (props.variant === "platform") {
    const showAlternatives = platformHasAlternatives(props);
    if (!showAlternatives) return null;

    return (
      <div className="space-y-2">
        {props.emailEnabled && (
          <div className="relative flex items-center justify-center">
            <Separator />
            <span className="absolute bg-card px-2.5 text-[11px] text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        )}
        <PasskeyButton redirectTo={props.redirectTo} />
        <ProviderButtons redirectTo={props.redirectTo} />
      </div>
    );
  }

  const hasAlternatives =
    props.passkeyEnabled || props.activeSocials.length > 0;
  if (!hasAlternatives) return null;

  return (
    <div className="space-y-2">
      {props.emailEnabled && (
        <div className="relative flex items-center py-1">
          <Separator className="flex-1" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            atau lanjutkan dengan
          </span>
          <Separator className="flex-1" />
        </div>
      )}

      {props.passkeyEnabled && (
        <Button
          type="button"
          variant="outline"
          color="secondary"
          className="w-full"
          disabled={props.disabled}
          onClick={props.onPasskey}
        >
          <Fingerprint className="mr-2 h-4 w-4 text-primary" />
          {props.passkeyLabel ?? "Daftar dengan Passkey"}
        </Button>
      )}

      {props.activeSocials.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {props.activeSocials.map((social) => (
            <Button
              key={social.id}
              type="button"
              variant="outline"
              color="secondary"
              className="w-full"
              disabled={props.disabled}
              onClick={() => props.onSocial(social.provider)}
            >
              <Icon icon={social.icon} className="mr-2 h-4 w-4" />
              {social.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}