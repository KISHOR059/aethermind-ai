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
