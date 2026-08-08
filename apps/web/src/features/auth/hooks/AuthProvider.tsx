import type { PropsWithChildren } from "react";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  authKeys,
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "./auth.hooks";
import {
  AuthContext,
  SIGN_OUT_REASON_KEY,
  type AuthContextValue,
  type SignOutReason,
} from "./auth.context";
import { authService } from "../services/auth.service";
import { tokenStorage } from "@/shared/lib/token-storage";
import { broadcastAuthSync, subscribeAuthSync } from "@/shared/lib/auth-sync";
import { setSessionExpiredHandler } from "@/shared/lib/api-client";
import { sessionActivity } from "../session/session-activity";
import type { User } from "../types";

type SignOutOptions = {
  skipServer?: boolean;
  skipBroadcast?: boolean;
};

function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const saveSession = (session: { accessToken: string; user: User }) => {
    tokenStorage.set(session.accessToken);
    sessionActivity.touch();
    queryClient.setQueryData(authKeys.currentUser, session.user);
    return session.user;
  };

  const signOut = useCallback(
    async (reason: SignOutReason = "user", options?: SignOutOptions) => {
      if (reason === "user" && !options?.skipServer) {
        try {
          await logoutMutation.mutateAsync();
        } catch {
          // Best effort: local cleanup and redirect must always happen.
        }
      }

      tokenStorage.remove();
      sessionActivity.reset();
      queryClient.clear();

      if (!options?.skipBroadcast) {
        broadcastAuthSync(reason === "session-expired" ? "session-expired" : "logout");
      }

      if (reason === "session-expired") {
        window.sessionStorage.setItem(SIGN_OUT_REASON_KEY, "session-expired");
      }

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    },
    [logoutMutation, queryClient],
  );

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void signOut("session-expired");
    });

    return () => {
      setSessionExpiredHandler(() => {
        // No-op fallback when the provider unmounts.
      });
    };
  }, [signOut]);

  useEffect(() => {
    return subscribeAuthSync((type) => {
      void signOut(type === "session-expired" ? "session-expired" : "user", {
        skipServer: true,
        skipBroadcast: true,
      });
    });
  }, [signOut]);

  const value: AuthContextValue = {
    user: currentUser.data ?? null,
    isAuthenticated: Boolean(currentUser.data),
    isLoading: currentUser.isLoading,
    login: async (input) => saveSession(await loginMutation.mutateAsync(input)),
    register: async (input) => saveSession(await registerMutation.mutateAsync(input)),
    logout: async () => {
      await signOut("user");
    },
    signOut,
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
