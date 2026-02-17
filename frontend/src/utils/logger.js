/**
 * Logger Utility for Frontend
 * Provides structured logging with environment-aware behavior
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Log levels
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLogLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

/**
 * Format log message with timestamp and context
 */
const formatLog = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  
  if (args.length > 0) {
    return { prefix, message, data: args };
  }
  return { prefix, message };
};

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Debug logs - only in development
   */
  debug: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      const formatted = formatLog('DEBUG', message, ...args);
      if (args.length > 0) {
        console.log(formatted.prefix, formatted.message, ...formatted.data);
      } else {
        console.log(formatted.prefix, formatted.message);
      }
    }
  },

  /**
   * Info logs - only in development
   */
  info: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      const formatted = formatLog('INFO', message, ...args);
      if (args.length > 0) {
        console.log(formatted.prefix, formatted.message, ...formatted.data);
      } else {
        console.log(formatted.prefix, formatted.message);
      }
    }
  },

  /**
   * Warning logs - shown in development, suppressed in production
   */
  warn: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      const formatted = formatLog('WARN', message, ...args);
      if (args.length > 0) {
        console.warn(formatted.prefix, formatted.message, ...formatted.data);
      } else {
        console.warn(formatted.prefix, formatted.message);
      }
    }
  },

  /**
   * Error logs - always shown, should be sent to error tracking service
   */
  error: (message, error, ...args) => {
    const formatted = formatLog('ERROR', message, error, ...args);
    
    if (error instanceof Error) {
      console.error(formatted.prefix, formatted.message, {
        message: error.message,
        stack: error.stack,
        ...formatted.data
      });
    } else {
      console.error(formatted.prefix, formatted.message, error, ...formatted.data);
    }

    // In production, send to error tracking service (e.g., Sentry)
    if (isProduction && error instanceof Error) {
      // TODO: Integrate with error tracking service
      // Example: Sentry.captureException(error);
    }
  }
};

export default logger;
