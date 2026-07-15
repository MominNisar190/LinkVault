export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;
  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class LinkExpiredError extends AppError {
  constructor() {
    super("This link has expired", 410, "LINK_EXPIRED");
  }
}

export class LinkDisabledError extends AppError {
  constructor() {
    super("This link is disabled", 404, "LINK_DISABLED");
  }
}

export class ClickLimitReachedError extends AppError {
  constructor() {
    super("This link has reached its click limit", 410, "CLICK_LIMIT_REACHED");
  }
}

// ─── API Response helpers ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(
  error: string,
  code?: string,
  errors?: Record<string, string[]>
): ApiResponse {
  return { success: false, error, code, errors };
}

export function handleApiError(error: unknown): ApiResponse {
  if (error instanceof ValidationError) {
    return errorResponse(error.message, error.code, error.errors);
  }
  if (error instanceof AppError) {
    return errorResponse(error.message, error.code);
  }
  if (error instanceof Error) {
    return errorResponse(error.message, "INTERNAL_ERROR");
  }
  return errorResponse("An unexpected error occurred", "INTERNAL_ERROR");
}
