/**
 * Input Sanitization Utility
 * Provides functions to sanitize user inputs and prevent XSS attacks
 */

/**
 * Sanitize a string input by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize an object by recursively sanitizing all string values
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize phone number - only allow digits, +, and spaces
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return phone;
  }
  
  // Remove all characters except digits, +, and spaces
  return phone.replace(/[^\d+\s]/g, '');
};

/**
 * Sanitize email - basic validation and sanitization
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return email;
  }
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"']/g, '');
  
  return sanitized;
};

/**
 * Sanitize numeric input
 * @param {string|number} input - Numeric input to sanitize
 * @returns {number|null} - Sanitized number or null if invalid
 */
export const sanitizeNumber = (input) => {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  
  if (typeof input === 'string') {
    const cleaned = input.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  return null;
};

/**
 * Sanitize form data object
 * @param {object} formData - Form data to sanitize
 * @returns {object} - Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return formData;
  }

  const sanitized = {};
  
  for (const key in formData) {
    if (formData.hasOwnProperty(key)) {
      const value = formData[key];
      
      // Special handling for specific field types
      if (key.toLowerCase().includes('phone')) {
        sanitized[key] = sanitizePhone(value);
      } else if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value);
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Sanitize URL input
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return url;
  }
  
  // Remove javascript: and data: protocols
  let sanitized = url.replace(/^(javascript|data):/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeFormData,
  sanitizeUrl
};
