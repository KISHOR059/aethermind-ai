import type { ErrorRequestHandler } from "express";

import { logger } from "../lib/logger.js";
import { AppError, InternalServerError } from "../utils/app-error.js";
import { errorResponse } from "../utils/response.js";

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  void _next;

  const normalizedError =
    error instanceof AppError ? error : new InternalServerError();

  logger.error(normalizedError.message, {
    requestId: _request.requestId,
    error: normalizedError.name,
    stack: error instanceof Error ? error.stack : undefined,
  });

  errorResponse(
    response,
    normalizedError.message,
    normalizedError.errors.map((item) => ({
      code: normalizedError.code,
      message: typeof item === "string" ? item : normalizedError.message,
    })),
    normalizedError.statusCode,
  );
};
