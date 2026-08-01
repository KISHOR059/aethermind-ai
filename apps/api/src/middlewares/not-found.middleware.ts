import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new AppError(`Route ${request.method} ${request.originalUrl} not found`, 404));
};
