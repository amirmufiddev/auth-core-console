export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return url ? url.replace(/\/$/, "") : "";
}

export function isExternalBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export function unwrapApiEnvelope<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiRequestError(
      "VITE_API_URL is not configured",
      0,
      "LOCAL_MODE",
    );
  }

  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    try {
      const errBody = (await response.json()) as {
        message?: string | string[];
        error?: string | { message?: string; code?: string };
        code?: string;
      };
      if (typeof errBody.message === "string") {
        message = errBody.message;
      } else if (Array.isArray(errBody.message) && errBody.message.length > 0) {
        message = errBody.message.join(", ");
      } else if (typeof errBody.error === "string") {
        message = errBody.error;
      } else if (errBody.error && typeof errBody.error === "object") {
        message = errBody.error.message ?? message;
        code = errBody.error.code;
      }
      code = code ?? errBody.code;
    } catch {
      // ignore invalid json
    }
    throw new ApiRequestError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  const parsed = JSON.parse(text) as unknown;
  return unwrapApiEnvelope<T>(parsed);
}
