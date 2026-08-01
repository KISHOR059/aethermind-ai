export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type PaginationOptions = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SortOptions<TField extends string = string> = {
  field: TField;
  direction: "asc" | "desc";
};

export type QueryOptions<
  TFilters extends object = Record<string, unknown>,
  TSortField extends string = string,
> = {
  pagination: PaginationOptions;
  sort: SortOptions<TSortField>;
  search?: string;
  filters: Partial<TFilters>;
  select?: readonly string[];
};
