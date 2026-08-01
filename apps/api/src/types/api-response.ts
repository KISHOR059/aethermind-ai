import type { ErrorCode } from "../constants/error-codes.js";
import type { PaginationMeta } from "../shared/query/types.js";

export type { PaginationMeta } from "../shared/query/types.js";

export type ApiError = {
  code?: ErrorCode | string;
  field?: string;
  message: string;
};

export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type FailureResponse = {
  success: false;
  message: string;
  errors: ApiError[];
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationMeta;
};
