import { z } from "zod";

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  type PaginationOptions,
} from "./types.js";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export function parsePagination(input: unknown): PaginationOptions {
  const { page, limit } = paginationQuerySchema.parse(input);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
