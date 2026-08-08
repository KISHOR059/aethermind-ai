import type { SessionDocument } from "./session.model.js";

export type CreateSessionData = {
  userId: string;
  refreshTokenHash: string;
  lastActivityAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

export type RotateSessionData = {
  refreshTokenHash: string;
  lastActivityAt: Date;
  expiresAt: Date;
};

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<SessionDocument>;
  findById(id: string): Promise<SessionDocument | null>;
  findActiveByUserId(userId: string): Promise<SessionDocument[]>;
  rotateRefreshToken(
    id: string,
    previousHash: string,
    data: RotateSessionData,
  ): Promise<SessionDocument | null>;
  revoke(id: string): Promise<SessionDocument | null>;
  revokeAllByUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number>;
}
