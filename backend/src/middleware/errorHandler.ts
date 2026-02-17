import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { config } from '../config/config';

// Custom API Error class
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    errors?: any[],
    isOperational = true,
    stack = ''
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code || 'API_ERROR';
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Validation Error class
export class ValidationError extends ApiError {
  constructor(message: string, errors?: any[]) {
    super(400, message, 'VALIDATION_ERROR', errors);
  }
}

// Authentication Error class
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

// Authorization Error class
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

// Not Found Error class
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND_ERROR');
  }
}

// Conflict Error class
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT_ERROR');
  }
}

// Rate Limit Error class
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_ERROR');
  }
}

// Convert Prisma errors to API errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint failed
      const targets = error.meta?.target as string[] || [];
      const field = targets[0] || 'field';
      return new ConflictError(`${field} already exists`);
    }
    
    case 'P2025': {
      // Record not found
      return new NotFoundError('Record not found');
    }
    
    case 'P2003': {
      // Foreign key constraint failed
      return new ValidationError('Invalid reference to related record');
    }
    
    case 'P2014': {
      // Required relation missing
      return new ValidationError('Required relation is missing');
    }
    
    case 'P2015': {
      // Required field missing
      return new ValidationError('Required field is missing');
    }
    
    case 'P2016': {
      // Query interpretation error
      return new ValidationError('Invalid query parameters');
    }
    
    case 'P2021': {
      // Table does not exist
      return new ApiError(500, 'Database schema error', 'DATABASE_SCHEMA_ERROR');
    }
    
    case 'P2022': {
      // Column does not exist
      return new ApiError(500, 'Database schema error', 'DATABASE_SCHEMA_ERROR');
    }
    
    default: {
      logger.error('Unhandled Prisma error:', error);
      return new ApiError(500, 'Database operation failed', 'DATABASE_ERROR');
    }
  }
};

// Convert JWT errors to API errors
const handleJwtError = (error: JsonWebTokenError): ApiError => {
  if (error instanceof TokenExpiredError) {
    return new AuthenticationError('Token has expired');
  }
  
  if (error instanceof NotBeforeError) {
    return new AuthenticationError('Token not yet valid');
  }
  
  return new AuthenticationError('Invalid token');
};

// Convert Zod validation errors to API errors
const handleZodError = (error: ZodError): ValidationError => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
  
  return new ValidationError('Validation failed', errors);
};

// Convert generic errors to API errors
const convertToApiError = (error: any): ApiError => {
  // If it's already an ApiError, return as is
  if (error instanceof ApiError) {
    return error;
  }
  
  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }
  
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error('Unknown Prisma error:', error);
    return new ApiError(500, 'Database operation failed', 'DATABASE_ERROR');
  }
  
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    logger.error('Prisma panic error:', error);
    return new ApiError(500, 'Database engine error', 'DATABASE_ENGINE_ERROR');
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error('Prisma initialization error:', error);
    return new ApiError(500, 'Database connection error', 'DATABASE_CONNECTION_ERROR');
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid query parameters');
  }
  
  // Handle JWT errors
  if (error instanceof JsonWebTokenError) {
    return handleJwtError(error);
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  
  // Handle Node.js errors
  if (error.code === 'ECONNREFUSED') {
    return new ApiError(503, 'Service unavailable', 'SERVICE_UNAVAILABLE');
  }
  
  if (error.code === 'ENOTFOUND') {
    return new ApiError(503, 'External service not found', 'EXTERNAL_SERVICE_ERROR');
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new ApiError(504, 'Operation timeout', 'TIMEOUT_ERROR');
  }
  
  // Log unknown errors
  logger.error('Unknown error:', error);
  
  // Return generic server error
  return new ApiError(
    500,
    config.isProduction ? 'Internal server error' : error.message || 'Unknown error',
    'INTERNAL_ERROR'
  );
};

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: any[];
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

// Main error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiError = convertToApiError(error);
  
  // Log error details
  logger.error('API Error:', {
    message: apiError.message,
    statusCode: apiError.statusCode,
    code: apiError.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    stack: apiError.stack,
    isOperational: apiError.isOperational,
  });
  
  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: apiError.message,
    code: apiError.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };
  
  // Add validation errors if present
  if (apiError.errors) {
    errorResponse.errors = apiError.errors;
  }
  
  // Add stack trace in development
  if (config.isDevelopment && apiError.stack) {
    errorResponse.stack = apiError.stack;
  }
  
  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'] as string;
  }
  
  // Send error response
  res.status(apiError.statusCode).json(errorResponse);
};

// 404 handler
export const notFound = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  
  logger.warn('Route not found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  res.status(404).json({
    success: false,
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body, query, and params
      const { body, query, params } = req;
      
      if (schema.body) {
        req.body = schema.body.parse(body);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(query);
      }
      
      if (schema.params) {
        req.params = schema.params.parse(params);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Health check error
export class HealthCheckError extends ApiError {
  public readonly service: string;
  
  constructor(service: string, message: string) {
    super(503, `Health check failed for ${service}: ${message}`, 'HEALTH_CHECK_ERROR');
    this.service = service;
  }
}

// Export all error classes and utilities
export {
  ApiError as default,
  asyncHandler as catchAsync,
};
