import { useMutation, useQuery } from "@tanstack/react-query";

import { authService } from "../services/auth.service";
import type { LoginInput, RegisterInput } from "../types";

export const authKeys = { currentUser: ["auth", "current-user"] as const };

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

