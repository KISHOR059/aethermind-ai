import type { RequestHandler } from "express";

import { UnauthorizedError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authService } from "./auth.container.js";

export const requireAuth: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const authorization = request.header("authorization");

    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("A Bearer access token is required");
    }

    request.user = await authService.authenticateAccessToken(token);

    next();
  },
);
