import { z } from "zod";

export function parseSearch(input: unknown, maxLength = 100): string | undefined {
  const search = z.string().trim().max(maxLength).optional().parse(input);

  return search || undefined;
}
