import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Middleware that authenticates incoming cron requests using the secret Bearer token.
 *
 * Requirements:
 * - Request must contain `Authorization: Bearer <CRON_SECRET>`
 * - Validates against the server-configured `env.CRON_SECRET`
 * - Returns 401 Unauthorized for missing, mismatched, or unconfigured secret
 * - Never logs or exposes the CRON_SECRET
 */
export const requireCronAuth: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const configuredSecret = env.CRON_SECRET;

    if (!configuredSecret) {
      throw new UnauthorizedError("Cron authentication is not configured on this server");
    }

    const authorization = request.header("authorization");
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token || token !== configuredSecret) {
      throw new UnauthorizedError("Invalid or missing cron authorization header");
    }

    next();
  },
);
