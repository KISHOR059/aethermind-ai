export function parseFilters<TFilters extends object>(
  input: TFilters,
): Partial<TFilters> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<TFilters>;
}
