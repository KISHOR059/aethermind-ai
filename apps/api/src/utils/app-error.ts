import { ERROR_CODES, type ErrorCode } from "../constants/error-codes.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { MESSAGES } from "../constants/messages.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly errors: unknown[];
  public readonly isOperational = true;

  public constructor(
    message: string,
    statusCode: number,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    errors: unknown[] = [],
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public constructor(
    message: string = MESSAGES.VALIDATION_ERROR,
    errors: unknown[] = [],
  ) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, errors);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  public constructor(message: string = MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  public constructor(message: string = MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  public constructor(message: string = MESSAGES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  public constructor(message: string = MESSAGES.CONFLICT) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    this.name = "ConflictError";
  }
}

export class AIProviderError extends AppError {
  public constructor(
    message = "The AI provider is temporarily unavailable",
    statusCode: number = HTTP_STATUS.BAD_GATEWAY,
    code: ErrorCode = ERROR_CODES.AI_PROVIDER_ERROR,
  ) {
    super(message, statusCode, code);
    this.name = "AIProviderError";
  }
}

export class AIProviderTimeoutError extends AIProviderError {
  public constructor() {
    super(
      "The AI provider timed out. Please try again.",
      HTTP_STATUS.GATEWAY_TIMEOUT ?? 504,
      ERROR_CODES.AI_PROVIDER_TIMEOUT,
    );
    this.name = "AIProviderTimeoutError";
  }
}

export class AIRateLimitError extends AIProviderError {
  public constructor() {
    super(
      "The AI service is busy. Please try again shortly.",
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.AI_RATE_LIMIT,
    );
    this.name = "AIRateLimitError";
  }
}

export class AIResponseError extends AppError {
  public constructor(errors: unknown[] = []) {
    super(
      "The AI returned an invalid plan. Please try again.",
      HTTP_STATUS.BAD_GATEWAY,
      ERROR_CODES.AI_RESPONSE_INVALID,
      errors,
    );
    this.name = "AIResponseError";
  }
}

export class InternalServerError extends AppError {
  public constructor(message: string = MESSAGES.INTERNAL_SERVER_ERROR) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_SERVER_ERROR);
    this.name = "InternalServerError";
  }
}
