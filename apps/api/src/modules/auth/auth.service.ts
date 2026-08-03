import bcrypt from "bcrypt";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";
import {
  ConflictError,
  UnauthorizedError,
} from "../../utils/app-error.js";
import type { AuthSession, PublicUser } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";
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
  public constructor(private readonly userRepository: IUserRepository) {}

  public async register(input: RegisterInput): Promise<AuthSession> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const password = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await this.userRepository.create({ ...input, password });

    return this.createSession(user);
  }

  public async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.userRepository.findByEmailWithPassword(input.email);
    const isPasswordValid = user
      ? await bcrypt.compare(input.password, user.password)
      : false;

    if (!user || !isPasswordValid || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.createSession(user);
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

    if (!payload.sub) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User is not authorized");
    }

    return this.createSession(user);
  }

  private createSession(user: UserDocument): AuthSession {
    const userId = user._id.toString();

    return {
      user: toPublicUser(user),
      accessToken: this.signToken(
        userId,
        user.role,
        env.JWT_ACCESS_SECRET,
        env.JWT_ACCESS_EXPIRES_IN,
      ),
      refreshToken: this.signToken(
        userId,
        user.role,
        env.JWT_REFRESH_SECRET,
        env.JWT_REFRESH_EXPIRES_IN,
      ),
    };
  }

  private signToken(
    subject: string,
    role: UserRole,
    secret: string,
    expiresIn: string,
  ): string {
    return jwt.sign(
      { sub: subject, role },
      secret,
      { expiresIn: expiresIn as SignOptions["expiresIn"] },
    );
  }

  private verifyToken(token: string, secret: string): JwtPayload {
    try {
      console.log("TOKEN:", token);

      const payload = jwt.verify(token, secret);

      console.log("JWT VERIFIED:", payload);

      if (typeof payload === "string") {
        throw new UnauthorizedError("Invalid access token");
      }

      return payload;
    } catch (error) {
      console.error("JWT VERIFY ERROR:", error);

      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError("Invalid or expired access token");
    }
  }
}
