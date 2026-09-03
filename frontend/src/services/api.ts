import axios from "axios";
import type { ApiResponse } from "../types/anime";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("abhistream_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("abhistream_token");
      localStorage.removeItem("abhistream_user");
      window.dispatchEvent(new CustomEvent("abhistream:auth-cleared"));
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const response = await api.get<ApiResponse<T>>(url, { params });
    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  try {
    const response = await api.post<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  try {
    const response = await api.patch<ApiResponse<T>>(url, data);
    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data.data as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function apiDelete(url: string): Promise<void> {
  try {
    const response = await api.delete<ApiResponse<unknown>>(url);
    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed");
    }
  } catch (error) {
    throw normalizeError(error);
  }
}

function normalizeError(error: unknown): Error {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  const serverMessage = e?.response?.data?.message;
  if (serverMessage) {
    return new Error(serverMessage);
  }
  if (e?.message) return new Error(e.message);
  return new Error("Network error. Please try again.");
}

export default api;
