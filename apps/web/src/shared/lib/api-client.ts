import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { beginRequest, endRequest } from "./request-state";
import { env } from "@/shared/config/env";
import { tokenStorage } from "@/shared/lib/token-storage";
import type { ApiSuccess } from "@/shared/types/api";

type ApiErrorDetail = { code?: string; field?: string; message: string };
type ApiErrorPayload = { success?: false; message?: string; errors?: ApiErrorDetail[] };

export class ApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly errors: ApiErrorDetail[];
  public readonly requestId?: string;

  public constructor(message: string, options: { status?: number; code?: string; errors?: ApiErrorDetail[]; requestId?: string } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.errors = options.errors ?? [];
    this.requestId = options.requestId;
  }
}

type RequestConfig = InternalAxiosRequestConfig & { _skipAuthRefresh?: boolean; __retryCount?: number };

const baseURL = env.apiUrl;
const refreshClient = axios.create({ baseURL, withCredentials: true, headers: { "Content-Type": "application/json" } });

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

function getAccessToken() {
  return tokenStorage.get();
}

function setAccessToken(token: string) {
  tokenStorage.set(token);
}

function normalizeError(error: unknown) {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return error instanceof Error ? error : new ApiError("Request failed");

  const response = error.response;
  const payload = response?.data;
  const message = payload?.message
    ?? (error.code === "ERR_CANCELED" ? "Request cancelled" : error.request ? "Network error. Check your connection." : "Request failed");
  return new ApiError(message, {
    status: response?.status,
    code: payload?.errors?.[0]?.code,
    errors: payload?.errors,
    requestId: response?.headers["x-request-id"],
  });
}

function isRetryable(error: AxiosError, config: RequestConfig) {
  const method = config.method?.toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD" || method === "OPTIONS";
  return isIdempotent && !error.response || isIdempotent && (error.response?.status ?? 0) >= 500;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiSuccess<{ user: unknown; accessToken: string }>>("/auth/refresh")
      .then(({ data }) => {
        const token = data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(
  (config) => {
    beginRequest();
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    endRequest();
    return Promise.reject(normalizeError(error));
  },
);

apiClient.interceptors.response.use(
  (response) => {
    endRequest();
    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    endRequest();
    const config = error.config as RequestConfig | undefined;

    if (!config) return Promise.reject(normalizeError(error));

    const isAuthEndpoint = ["/auth/login", "/auth/register", "/auth/logout", "/auth/refresh"].some((path) => config.url?.endsWith(path));

    if (error.response?.status === 401 && !config._skipAuthRefresh && !isAuthEndpoint) {
      try {
        const token = await refreshAccessToken();
        config._skipAuthRefresh = true;
        config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config);
      } catch (refreshError) {
        tokenStorage.remove();
        if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
        return Promise.reject(normalizeError(refreshError));
      }
    }

    const retryCount = config.__retryCount ?? 0;
    if (isRetryable(error, config) && retryCount < 2) {
      config.__retryCount = retryCount + 1;
      await wait(250 * 2 ** retryCount);
      return apiClient(config);
    }

    return Promise.reject(normalizeError(error));
  },
);

export default apiClient;
