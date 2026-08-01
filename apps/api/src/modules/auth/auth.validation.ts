import type { RequestHandler } from "express";
import { z } from "zod";

import { ValidationError } from "../../utils/app-error.js";

const nameSchema = z.string().trim().min(1).max(80);

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  avatar: z.string().trim().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function validateBody<T>(schema: z.ZodType<T>): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

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

    request.body = result.data;
    next();
  };
}
