import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { MESSAGES } from "../../constants/messages.js";
import { parseDuration } from "../../utils/duration.js";
import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import { authService } from "./auth.container.js";
import type { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

export const REFRESH_TOKEN_COOKIE = "aethermind_refresh_token";

export function getRefreshCookieOptions() {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/api/v1/auth",
    maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
  };
}

function decodeSessionId(refreshToken: string): string | undefined {
  const payload = jwt.decode(refreshToken);

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sid !== "string"
  ) {
    return undefined;
  }

  return payload.sid;
}

export class AuthController {
  public constructor(private readonly service: AuthService) {}

  public register = async (request: Request, response: Response): Promise<void> => {
    const session = await this.service.register(
      request.body as RegisterInput,
      this.deviceInfo(request),
    );

    this.setRefreshToken(response, session.refreshToken);
    successResponse(
      response,
      { user: session.user, accessToken: session.accessToken },
      "Registration successful",
    );
  };

  public login = async (request: Request, response: Response): Promise<void> => {
    const session = await this.service.login(
      request.body as LoginInput,
      this.deviceInfo(request),
    );

    this.setRefreshToken(response, session.refreshToken);
    successResponse(
      response,
      { user: session.user, accessToken: session.accessToken },
      "Login successful",
    );
  };

  public logout = async (request: Request, response: Response): Promise<void> => {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
    const sessionId = refreshToken ? decodeSessionId(refreshToken) : undefined;

    if (sessionId) {
      await this.service.revokeSessionById(sessionId);
    }

    response.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
    successResponse(response, {}, "Logout successful");
  };

  public logoutAll = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    await this.service.revokeAllSessions(request.user.id);

    response.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
    successResponse(response, {}, "All sessions signed out");
  };

  public refresh = async (request: Request, response: Response): Promise<void> => {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError("A refresh token is required");
    }

    const session = await this.service.refreshSession(refreshToken);
    this.setRefreshToken(response, session.refreshToken);
    successResponse(
      response,
      { user: session.user, accessToken: session.accessToken },
      "Token refreshed",
    );
  };

  public me = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is not available");
    }

    successResponse(response, { user: request.user }, MESSAGES.AUTHENTICATED_USER);
  };

  public listSessions = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const sessions = await this.service.listSessions(
      request.user.id,
      this.currentSessionId(request),
    );

    successResponse(response, { sessions }, "Sessions retrieved successfully");
  };

  public revokeSession = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is required");
    }

    const sessionId = Array.isArray(request.params.sessionId)
      ? request.params.sessionId[0]
      : request.params.sessionId;
    const currentSessionId = this.currentSessionId(request);

    await this.service.revokeSession(request.user.id, sessionId);

    if (currentSessionId === sessionId) {
      response.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
    }

    successResponse(response, {}, "Session revoked successfully");
  };

  private currentSessionId(request: Request): string | undefined {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;

    return refreshToken ? decodeSessionId(refreshToken) : undefined;
  }

  private deviceInfo(request: Request): { userAgent?: string; ipAddress?: string } {
    const forwardedFor = request.headers["x-forwarded-for"];
    const rawIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const ipAddress =
      rawIp?.split(",")[0]?.trim() ||
      (typeof request.ip === "string" ? request.ip : undefined);

    return {
      userAgent: request.get("user-agent")?.slice(0, 500),
      ipAddress,
    };
  }

  private setRefreshToken(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions());
  }
}

export const authController = new AuthController(authService);
