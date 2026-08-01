import { z } from "zod";

import { AIParseError, type AIParseIssue } from "./response.types.js";

export function validateSchema<T>(
  value: unknown,
  schema: z.ZodType<T>,
): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    const issues: AIParseIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.filter(
        (segment): segment is string | number =>
          typeof segment === "string" || typeof segment === "number",
      ),
      message: issue.message,
      code: issue.code,
    }));

    throw new AIParseError(
      "AI response failed schema validation",
      "SCHEMA_VALIDATION_FAILED",
      issues,
    );
  }

  return result.data;
}
