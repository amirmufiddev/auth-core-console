import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  anonymousClient,
  deviceAuthorizationClient,
  emailOTPClient,
  jwtClient,
  lastLoginMethodClient,
  magicLinkClient,
  multiSessionClient,
  oneTapClient,
  oneTimeTokenClient,
  organizationClient,
  phoneNumberClient,
  siweClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { apiKeyClient } from "@better-auth/api-key/client";
import { ssoClient } from "@better-auth/sso/client";

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const baseURL =
  rawApiUrl && rawApiUrl.trim().length > 0
    ? rawApiUrl.replace(/\/$/, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:2000";

const basePath =
  (import.meta.env.VITE_AUTH_BASE_PATH as string | undefined) || "/api/auth";

export const authClient = createAuthClient({
  baseURL,
  basePath,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    passkeyClient(),
    magicLinkClient(),
    emailOTPClient(),
    usernameClient(),
    phoneNumberClient(),
    anonymousClient(),
    multiSessionClient(),
    oneTapClient({ clientId: "authcore-one-tap-client" }),
    jwtClient(),
    deviceAuthorizationClient(),
    siweClient(),
    apiKeyClient(),
    ssoClient(),
    lastLoginMethodClient(),
    oneTimeTokenClient(),
  ],
});
