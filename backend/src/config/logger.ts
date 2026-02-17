import winston from 'winston';
import { config } from './config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const simpleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.logging.format === 'json' ? logFormat : simpleFormat,
  }),
];

// Add file transports in production
if (config.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Request logger middleware
export const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/requests.log',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Stream for Morgan middleware
export const stream = {
  write: (message: string) => {
    requestLogger.info(message.trim());
  },
};

// Audit logger for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/audit.log',
            maxsize: 5242880,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

// Performance logger
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/performance.log',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Business logic logger
export const businessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/business.log',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Security logger for authentication and authorization events
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/security.log',
            maxsize: 5242880,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

// Log helper functions
export const logHelpers = {
  // Log API request/response
  logApiCall: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    userRole?: string
  ) => {
    performanceLogger.info('API Call', {
      method,
      url,
      statusCode,
      duration,
      userId,
      userRole,
      type: 'api_call',
    });
  },

  // Log database query performance
  logDbQuery: (query: string, duration: number, affected?: number) => {
    performanceLogger.info('Database Query', {
      query: query.slice(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      affected,
      type: 'db_query',
    });
  },

  // Log business events
  logBusinessEvent: (
    event: string,
    entityType: string,
    entityId: string,
    userId?: string,
    metadata?: any
  ) => {
    businessLogger.info('Business Event', {
      event,
      entityType,
      entityId,
      userId,
      metadata,
      type: 'business_event',
    });
  },

  // Log security events
  logSecurityEvent: (
    event: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    details?: any
  ) => {
    securityLogger.info('Security Event', {
      event,
      userId,
      ipAddress,
      userAgent,
      success,
      details,
      type: 'security_event',
    });
  },

  // Log audit events
  logAuditEvent: (
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string
  ) => {
    auditLogger.info('Audit Event', {
      action,
      entityType,
      entityId,
      userId,
      oldValues,
      newValues,
      ipAddress,
      type: 'audit_event',
    });
  },

  // Log error with context
  logError: (
    error: Error,
    context?: string,
    userId?: string,
    metadata?: any
  ) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      userId,
      metadata,
      type: 'error',
    });
  },
};

export default logger;
