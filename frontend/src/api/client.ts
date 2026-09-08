import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { getAuthSnapshot, useAuthStore } from "@/stores/auth-store";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | unknown[];
  status?: number;
}

/** Backend's custom_exception_handler always emits this shape on error. */
interface RawErrorPayload {
  success: false;
  error?: { code: string; message: string; details?: unknown };
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthSnapshot().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh-token queueing so concurrent 401s only trigger one refresh ---
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getAuthSnapshot().refreshToken;
  if (!refresh) throw new Error("No refresh token available.");
  const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
  // simplejwt's TokenRefreshView returns the raw payload, not the envelope.
  const access: string = res.data.access;
  useAuthStore.getState().setAccessToken(access);
  return access;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<RawErrorPayload>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/token/refresh");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      if (!getAuthSnapshot().refreshToken) {
        useAuthStore.getState().clear();
        return Promise.reject(normalizeError(error));
      }

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (original.headers) original.headers.Authorization = `Bearer ${token}`;
              resolve(httpClient(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const token = await refreshAccessToken();
        flushQueue(null, token);
        if (original.headers) original.headers.Authorization = `Bearer ${token}`;
        return httpClient(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        useAuthStore.getState().clear();
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as RawErrorPayload | undefined;
    if (payload?.error) {
      return {
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details as Record<string, unknown> | unknown[] | undefined,
        status: error.response?.status,
      };
    }
    if (error.code === "ERR_NETWORK") {
      return { code: "network_error", message: "Can't reach the server. Check your connection and try again." };
    }
    return {
      code: "unknown_error",
      message: error.message || "Something went wrong. Please try again.",
      status: error.response?.status,
    };
  }
  if (error instanceof Error) return { code: "unknown_error", message: error.message };
  return { code: "unknown_error", message: "Something went wrong. Please try again." };
}

/** Unwraps `{success, data}` envelopes; passes through raw payloads (simplejwt, MeView) as-is. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in (payload as object)) {
    return (payload as unknown as { data: T }).data;
  }
  return payload as T;
}

export interface Paginated<T> {
  items: T[];
  count: number;
  page: number;
  pages: number;
  pageSize: number;
}

/** Unwraps the app's custom paginated shape: `{success, pagination, results}`. */
export function unwrapList<T>(payload: unknown): Paginated<T> {
  if (payload && typeof payload === "object" && "results" in (payload as object)) {
    const p = payload as { results: T[]; pagination?: { count: number; page: number; pages: number; page_size: number } };
    return {
      items: p.results,
      count: p.pagination?.count ?? p.results.length,
      page: p.pagination?.page ?? 1,
      pages: p.pagination?.pages ?? 1,
      pageSize: p.pagination?.page_size ?? p.results.length,
    };
  }
  if (Array.isArray(payload)) {
    return { items: payload as T[], count: payload.length, page: 1, pages: 1, pageSize: payload.length };
  }
  return { items: [], count: 0, page: 1, pages: 1, pageSize: 0 };
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.get(url, config);
  return unwrap<T>(res.data);
}

export async function getList<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
  const res = await httpClient.get(url, config);
  return unwrapList<T>(res.data);
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.post(url, body, config);
  return unwrap<T>(res.data);
}

export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.patch(url, body, config);
  return unwrap<T>(res.data);
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await httpClient.delete(url, config);
  return unwrap<T>(res.data);
}
