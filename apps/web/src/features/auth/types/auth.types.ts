export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = { user: User; accessToken: string };

export type SessionInfo = {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  isCurrent: boolean;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { firstName: string; lastName: string };

