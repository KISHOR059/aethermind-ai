import type { RequestHandler } from "express";
import { z } from "zod";

import { ValidationError } from "../utils/app-error.js";

function createValidationMiddleware<T>(
  schema: z.ZodType<T>,
  source: "body" | "query",
): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request[source]);

    if (!result.success) {
      next(
        new ValidationError(
          undefined,
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    Object.defineProperty(request, source, {
      configurable: true,
      enumerable: true,
      value: result.data,
      writable: true,
    });
    next();
  };
}

export function validateBody<T>(schema: z.ZodType<T>): RequestHandler {
  return createValidationMiddleware(schema, "body");
}

export function validateQuery<T>(schema: z.ZodType<T>): RequestHandler {
  return createValidationMiddleware(schema, "query");
}
