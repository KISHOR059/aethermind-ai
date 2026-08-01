import type { ErrorCode } from "../constants/error-codes.js";

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

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationMeta;
};
