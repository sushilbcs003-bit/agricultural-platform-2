import { Request } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from './apiError';

// Common validation schemas
export const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format');
export const emailSchema = z.string().email('Invalid email address');
export const aadhaarSchema = z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits');
export const gstSchema = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const otpSchema = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

// Validate request using Zod schema
export function validateRequest(schema: ZodSchema, req: Request) {
  try {
    schema.parse(req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    throw error;
  }
}

// Validate individual fields
export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validateAadhaar(aadhaar: string): boolean {
  return aadhaarSchema.safeParse(aadhaar).success;
}

export function validateGST(gst: string): boolean {
  return gstSchema.safeParse(gst).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validateOTP(otp: string): boolean {
  return otpSchema.safeParse(otp).success;
}

// Sanitize input data
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeObject(obj: any, allowedFields: string[]): any {
  const sanitized: any = {};
  
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      if (typeof obj[field] === 'string') {
        sanitized[field] = sanitizeString(obj[field]);
      } else {
        sanitized[field] = obj[field];
      }
    }
  });
  
  return sanitized;
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

// File validation
export function validateImageFile(file: any): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }

  return { isValid: true };
}

// Pagination validation
export function validatePagination(page?: string, limit?: string): { page: number; limit: number } {
  const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));

  return { page: pageNum, limit: limitNum };
}

// Sort validation
export function validateSort(sortBy?: string, sortOrder?: string, allowedFields: string[] = []): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const validSortBy = allowedFields.includes(sortBy || '') ? sortBy! : 'createdAt';
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  return { sortBy: validSortBy, sortOrder: validSortOrder };
}

// Date validation
export function validateDateRange(startDate?: string, endDate?: string): {
  startDate?: Date;
  endDate?: Date;
  isValid: boolean;
  error?: string;
} {
  if (!startDate && !endDate) {
    return { isValid: true };
  }

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  if (start && isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date' };
  }

  if (end && isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid end date' };
  }

  if (start && end && start > end) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  return { isValid: true, startDate: start, endDate: end };
}

// Price validation
export function validatePriceRange(minPrice?: string, maxPrice?: string): {
  minPrice?: number;
  maxPrice?: number;
  isValid: boolean;
  error?: string;
} {
  const min = minPrice ? parseFloat(minPrice) : undefined;
  const max = maxPrice ? parseFloat(maxPrice) : undefined;

  if (min !== undefined && (isNaN(min) || min < 0)) {
    return { isValid: false, error: 'Invalid minimum price' };
  }

  if (max !== undefined && (isNaN(max) || max < 0)) {
    return { isValid: false, error: 'Invalid maximum price' };
  }

  if (min !== undefined && max !== undefined && min > max) {
    return { isValid: false, error: 'Minimum price must be less than maximum price' };
  }

  return { isValid: true, minPrice: min, maxPrice: max };
}