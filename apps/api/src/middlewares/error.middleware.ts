import type { ErrorRequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  void _next;

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    error instanceof AppError ? error.message : "Internal server error";

  response.status(statusCode).json({
    status: "error",
    message,
  });
};
