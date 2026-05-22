type ApiClientRuntimeConfig = {
  apiBaseUrl?: string;
  apiHeaders?: Record<string, string>;
  apiCredentials?: RequestCredentials;
};

declare global {
  interface Window {
    __VORTEX_CONFIG__?: ApiClientRuntimeConfig;
  }
}

export type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    [key: string]: unknown;
  };
};

export type ApiError = Error & {
  data?: ApiErrorPayload;
  status?: number;
};

export function getApiErrorPayload(error: unknown): ApiErrorPayload | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as ApiError).data;
  if (!data || typeof data !== "object") return null;
  return data as ApiErrorPayload;
}

const envApiBaseUrl =
  import.meta.env.RSBUILD_PUBLIC_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "";

function getRuntimeConfig(): ApiClientRuntimeConfig | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__VORTEX_CONFIG__;
}

function getApiBaseUrl(): string {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiBaseUrl ?? envApiBaseUrl ?? "";
}

function getApiCredentials(): RequestCredentials {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiCredentials ?? "include";
}

function getApiHeaders(): Record<string, string> {
  const runtimeConfig = getRuntimeConfig();
  return runtimeConfig?.apiHeaders ?? {};
}

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return path;
  const base = apiBaseUrl.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const body = isJson ? ((await res.json()) as unknown) : await res.text();
  if (!res.ok) {
    const payload = (body as ApiErrorPayload | null) ?? null;
    const rawMessage =
      payload?.error?.message ??
      (typeof body === "string" && body.trim() ? body : null) ??
      res.statusText;
    const message = `HTTP ${res.status}${rawMessage ? `: ${rawMessage}` : ""}`;
    const error = new Error(message) as ApiError;
    if (payload) error.data = payload;
    error.status = res.status;
    throw error;
  }
  return body as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    credentials: getApiCredentials(),
    headers: getApiHeaders(),
  });
  return await readJsonResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: { headers?: HeadersInit },
): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    method: "POST",
    credentials: getApiCredentials(),
    headers: {
      ...getApiHeaders(),
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  return await readJsonResponse<T>(res);
}
