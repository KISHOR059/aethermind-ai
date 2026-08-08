import type { ApiSuccess } from "@/shared/types/api";
import apiClient from "@/shared/lib/api-client";

import type { AuthSession, LoginInput, RegisterInput, SessionInfo, User } from "../types";

export const authService = {
  async login(input: LoginInput) {
    const response = await apiClient.post<ApiSuccess<AuthSession>>("/auth/login", input);
    return response.data.data;
  },
  async register(input: RegisterInput) {
    const response = await apiClient.post<ApiSuccess<AuthSession>>("/auth/register", input);
    return response.data.data;
  },
  async currentUser() {
    const response = await apiClient.get<ApiSuccess<{ user: User }>>("/auth/me");
    return response.data.data.user;
  },
  async refresh() {
    const response = await apiClient.post<ApiSuccess<AuthSession>>("/auth/refresh");
    return response.data.data;
  },
  async logout() {
    await apiClient.post<ApiSuccess<Record<string, never>>>("/auth/logout");
  },
  async listSessions() {
    const response = await apiClient.get<ApiSuccess<{ sessions: SessionInfo[] }>>("/auth/sessions");
    return response.data.data.sessions;
  },
  async revokeSession(sessionId: string) {
    await apiClient.delete<ApiSuccess<Record<string, never>>>(`/auth/sessions/${sessionId}`);
  },
  async logoutAll() {
    await apiClient.post<ApiSuccess<Record<string, never>>>("/auth/logout-all");
  },
};

