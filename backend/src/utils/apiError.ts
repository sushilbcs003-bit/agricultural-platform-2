export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends ApiError {
  errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(400, message);
    this.errors = errors;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict') {
    super(409, message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message);
  }
}

// Error response helper
export const createErrorResponse = (error: ApiError) => {
  return {
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode,
      ...(error instanceof ValidationError && { errors: error.errors }),
    },
  };
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;