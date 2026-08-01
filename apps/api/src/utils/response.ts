import type { Response } from "express";

import { HTTP_STATUS } from "../constants/http-status.js";
import type {
  ApiError,
  PaginatedData,
  PaginationMeta,
  SuccessResponse,
} from "../types/api-response.js";

export function successResponse<T>(
  response: Response,
  data: T,
  message = "Success",
  statusCode: number = HTTP_STATUS.OK,
): Response<SuccessResponse<T>> {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function createdResponse<T>(
  response: Response,
  data: T,
  message = "Created successfully",
): Response<SuccessResponse<T>> {
  return successResponse(response, data, message, HTTP_STATUS.CREATED);
}

export function errorResponse(
  response: Response,
  message: string,
  errors: ApiError[] = [],
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
): Response {
  return response.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function paginatedResponse<T>(
  response: Response,
  items: T[],
  pagination: PaginationMeta,
  message = "Success",
): Response<SuccessResponse<PaginatedData<T>>> {
  return successResponse(response, { items, pagination }, message);
}
