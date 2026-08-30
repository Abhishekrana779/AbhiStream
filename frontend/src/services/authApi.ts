import { apiGet, apiPost, apiPatch, apiDelete } from "./api";
import type { AuthResponse, LoginData, RegisterData, User } from "../types/user";

export const authApi = {
  login: (data: LoginData) =>
    apiPost<AuthResponse>("/auth/login", data),

  register: (data: RegisterData) =>
    apiPost<AuthResponse>("/auth/register", data),

  getMe: () =>
    apiGet<User>("/auth/me"),

  updateProfile: (data: { username?: string; avatar?: string }) =>
    apiPatch<User>("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiPatch<null>("/auth/password", data),

  deleteAccount: () => apiDelete("/auth/account"),
};
