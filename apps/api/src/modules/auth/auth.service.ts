import bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { hashToken } from "../../utils/hash.js";
import {
  ConflictError,
  NotFoundError,
  SessionExpiredError,
  UnauthorizedError,
} from "../../utils/app-error.js";
import type {
  AuthSession,
  DeviceInfo,
  PublicSession,
  PublicUser,
} from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";
import type { ISessionRepository } from "./session.repository.interface.js";
import { type UserDocument, UserRole } from "./user.model.js";
import type { IUserRepository } from "./user.repository.interface.js";

const PASSWORD_SALT_ROUNDS = 12;

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AuthService {
  public constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
  ) {}

  public async register(
    input: RegisterInput,
    deviceInfo?: DeviceInfo,
  ): Promise<AuthSession> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const password = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await this.userRepository.create({ ...input, password });

    return this.createSession(user, deviceInfo);
  }

  public async login(
    input: LoginInput,
    deviceInfo?: DeviceInfo,
  ): Promise<AuthSession> {
    const user = await this.userRepository.findByEmailWithPassword(input.email);
    const isPasswordValid = user
      ? await bcrypt.compare(input.password, user.password)
      : false;

    if (!user || !isPasswordValid || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.createSession(user, deviceInfo);
  }

  public async authenticateAccessToken(token: string): Promise<PublicUser> {
    const payload = this.verifyToken(token, env.JWT_ACCESS_SECRET);

    if (!payload.sub) {
      throw new UnauthorizedError("Invalid access token");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User is not authorized");
    }

    return toPublicUser(user);
  }

  public async refreshSession(refreshToken: string): Promise<AuthSession> {
    const payload = this.verifyToken(refreshToken, env.JWT_REFRESH_SECRET);

    if (!payload.sub || typeof payload.sid !== "string") {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const session = await this.sessionRepository.findById(payload.sid);

    if (!session) {
      throw new UnauthorizedError("Session is no longer valid");
    }

    if (session.userId.toString() !== payload.sub) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (session.revokedAt) {
      throw new UnauthorizedError("Session has been revoked");
    }

    const now = new Date();

    if (now.getTime() - session.lastActivityAt.getTime() > env.SESSION_INACTIVITY_TIMEOUT_MS) {
      await this.sessionRepository.revoke(session._id.toString());
      throw new SessionExpiredError("Your session has expired due to inactivity");
    }

    if (now.getTime() > session.absoluteExpiresAt.getTime()) {
      await this.sessionRepository.revoke(session._id.toString());
      throw new SessionExpiredError("Your session has expired");
    }

    const presentedHash = hashToken(refreshToken);

    if (presentedHash !== session.refreshTokenHash) {
      await this.sessionRepository.revoke(session._id.toString());
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User is not authorized");
    }

    const newRefreshToken = this.signRefreshToken(
      payload.sub,
      session._id.toString(),
      user.role,
    );
    const lastActivityAt = new Date();
    const expiresAt = new Date(
      lastActivityAt.getTime() + env.SESSION_INACTIVITY_TIMEOUT_MS,
    );

    const rotated = await this.sessionRepository.rotateRefreshToken(
      session._id.toString(),
      session.refreshTokenHash,
      {
        refreshTokenHash: hashToken(newRefreshToken),
        lastActivityAt,
        expiresAt,
      },
    );

    if (!rotated) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    return {
      user: toPublicUser(user),
      accessToken: this.signAccessToken(user._id.toString(), user.role),
      refreshToken: newRefreshToken,
    };
  }

  public async revokeSessionById(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.revoke(sessionId);

    return session !== null;
  }

  public async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session || session.userId.toString() !== userId) {
      throw new NotFoundError("Session not found");
    }

    await this.sessionRepository.revoke(sessionId);
  }

  public async revokeAllSessions(userId: string): Promise<number> {
    return this.sessionRepository.revokeAllByUser(userId);
  }

  public async listSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<PublicSession[]> {
    const sessions = await this.sessionRepository.findActiveByUserId(userId);

    return sessions.map((session) => ({
      id: session._id.toString(),
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: session._id.toString() === currentSessionId,
    }));
  }

  private async createSession(
    user: UserDocument,
    deviceInfo?: DeviceInfo,
  ): Promise<AuthSession> {
    const userId = user._id.toString();
    const now = new Date();

    const session = await this.sessionRepository.create({
      userId,
      refreshTokenHash: randomBytes(32).toString("hex"),
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + env.SESSION_INACTIVITY_TIMEOUT_MS),
      absoluteExpiresAt: new Date(now.getTime() + env.SESSION_MAX_LIFETIME_MS),
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress,
    });

    const refreshToken = this.signRefreshToken(
      userId,
      session._id.toString(),
      user.role,
    );

    await this.sessionRepository.rotateRefreshToken(
      session._id.toString(),
      session.refreshTokenHash,
      {
        refreshTokenHash: hashToken(refreshToken),
        lastActivityAt: now,
        expiresAt: session.expiresAt,
      },
    );

    return {
      user: toPublicUser(user),
      accessToken: this.signAccessToken(userId, user.role),
      refreshToken,
    };
  }

  private signAccessToken(subject: string, role: UserRole): string {
    return jwt.sign(
      { sub: subject, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] },
    );
  }

  private signRefreshToken(
    subject: string,
    sessionId: string,
    role: UserRole,
  ): string {
    return jwt.sign(
      { sub: subject, sid: sessionId, role, jti: randomUUID() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] },
    );
  }

  private verifyToken(token: string, secret: string): JwtPayload {
    try {
      const payload = jwt.verify(token, secret);

      if (typeof payload === "string") {
        throw new UnauthorizedError("Invalid token");
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
