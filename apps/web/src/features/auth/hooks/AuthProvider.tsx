import type { PropsWithChildren } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authKeys, useCurrentUser, useLogin, useLogout, useRegister } from "./auth.hooks";
import { AuthContext, type AuthContextValue } from "./auth.context";
import { authService } from "../services/auth.service";
import { tokenStorage } from "@/shared/lib/token-storage";
import type { User } from "../types";

function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const saveSession = (session: { accessToken: string; user: User }) => {
    tokenStorage.set(session.accessToken);
    queryClient.setQueryData(authKeys.currentUser, session.user);
    return session.user;
  };

  const value: AuthContextValue = {
    user: currentUser.data ?? null,
    isAuthenticated: Boolean(currentUser.data),
    isLoading: currentUser.isLoading,
    login: async (input) => saveSession(await loginMutation.mutateAsync(input)),
    register: async (input) => saveSession(await registerMutation.mutateAsync(input)),
    logout: async () => {
      try {
        await logoutMutation.mutateAsync();
      } finally {
        tokenStorage.remove();
        queryClient.removeQueries({ queryKey: authKeys.currentUser });
        window.location.assign("/login");
      }
    },
    refreshSession: async () => {
      try {
        return saveSession(await authService.refresh());
      } catch {
        tokenStorage.remove();
        queryClient.removeQueries({ queryKey: authKeys.currentUser });
        return null;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
