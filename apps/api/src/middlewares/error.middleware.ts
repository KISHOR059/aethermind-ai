import type { ErrorRequestHandler } from "express";

import { logger } from "../lib/logger.js";
import { AppError, InternalServerError } from "../utils/app-error.js";
import { errorResponse } from "../utils/response.js";

function isErrorDetail(value: unknown): value is { field?: string; message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

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

  const errors = normalizedError.errors.map((item) => {
    if (isErrorDetail(item)) {
      return {
        code: normalizedError.code,
        ...(item.field ? { field: item.field } : {}),
        message: item.message,
      };
    }

    return {
      code: normalizedError.code,
      message: typeof item === "string" ? item : normalizedError.message,
    };
  });

  errorResponse(response, normalizedError.message, errors, normalizedError.statusCode);
};
