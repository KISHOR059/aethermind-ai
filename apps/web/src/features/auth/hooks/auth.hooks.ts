import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authService } from "../services/auth.service";
import type { LoginInput, RegisterInput } from "../types";

export const authKeys = {
  currentUser: ["auth", "current-user"] as const,
  sessions: ["auth", "sessions"] as const,
};

export function useCurrentUser() {
  return useQuery({ queryKey: authKeys.currentUser, queryFn: authService.currentUser });
}

export function useLogin() {
  return useMutation({ mutationFn: (input: LoginInput) => authService.login(input) });
}

export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => authService.register(input) });
}

export function useLogout() {
  return useMutation({ mutationFn: authService.logout });
}

export function useSessions() {
  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: authService.listSessions,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRevokeSession() {
  return useMutation({ mutationFn: (sessionId: string) => authService.revokeSession(sessionId) });
}

export function useLogoutAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}
