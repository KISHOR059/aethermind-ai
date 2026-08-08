import { createContext, useContext } from "react";

import type { LoginInput, RegisterInput, User } from "../types";

export type SignOutReason = "user" | "session-expired";

export const SIGN_OUT_REASON_KEY = "aethermind_signout_reason";

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  signOut: (reason?: SignOutReason) => Promise<void>;
  refreshSession: () => Promise<User | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
