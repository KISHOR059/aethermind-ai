import type { UserRole } from "./user.model.js";

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUser = PublicUser;

export type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type DeviceInfo = {
  userAgent?: string;
  ipAddress?: string;
};

export type PublicSession = {
  id: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isCurrent: boolean;
};
