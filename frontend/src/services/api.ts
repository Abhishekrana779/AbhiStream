import axios from "axios";
import type { ApiResponse } from "../types/anime";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("abhistream_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("abhistream_token");
      localStorage.removeItem("abhistream_user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<ApiResponse<T>>(url, { params });
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.post<ApiResponse<T>>(url, data);
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.patch<ApiResponse<T>>(url, data);
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
}

export async function apiDelete(url: string): Promise<void> {
  const response = await api.delete<ApiResponse<unknown>>(url);
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
}

export default api;
