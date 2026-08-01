import { z } from "zod";

import type { SortOptions } from "./types.js";

export function parseSort<TField extends string>(
  input: unknown,
  fields: readonly [TField, ...TField[]],
  defaultField: TField,
): SortOptions<TField> {
  const result = z
    .object({
      sortBy: z.enum(fields).default(defaultField),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .parse(input);

  return {
    field: result.sortBy,
    direction: result.sortOrder,
  };
}
