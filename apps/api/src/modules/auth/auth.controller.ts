import type { Request, Response } from "express";

import { env } from "../../config/env.js";
import { MESSAGES } from "../../constants/messages.js";
import { UnauthorizedError } from "../../utils/app-error.js";
import { successResponse } from "../../utils/response.js";
import { authService } from "./auth.container.js";
import type { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

export const REFRESH_TOKEN_COOKIE = "aethermind_refresh_token";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  public constructor(private readonly service: AuthService) {}

  public register = async (request: Request, response: Response): Promise<void> => {
    const session = await this.service.register(request.body as RegisterInput);

    this.setRefreshToken(response, session.refreshToken);
    successResponse(
      response,
      { user: session.user, accessToken: session.accessToken },
      "Registration successful",
    );
  };

  public login = async (request: Request, response: Response): Promise<void> => {
    const session = await this.service.login(request.body as LoginInput);

    this.setRefreshToken(response, session.refreshToken);
    successResponse(
      response,
      { user: session.user, accessToken: session.accessToken },
      "Login successful",
    );
  };

  public logout = async (_request: Request, response: Response): Promise<void> => {
    response.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);
    successResponse(response, {}, "Logout successful");
  };

  public me = async (request: Request, response: Response): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError("Authenticated user is not available");
    }

    successResponse(response, { user: request.user }, MESSAGES.AUTHENTICATED_USER);
  };

  private setRefreshToken(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
  }
}

export const authController = new AuthController(authService);
