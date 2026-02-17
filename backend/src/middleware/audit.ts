import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Audit logging middleware
export const auditMiddleware = (action: string, resource?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData: any = null;
    let statusCode: number = 200;

    res.json = function(data: any) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with request
    res.on('finish', async () => {
      try {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const auditData: AuditLogData = {
          userId: (req as any).user?.id,
          action: `${req.method}_${action}`,
          resource,
          resourceId: req.params.id,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeRequestBody(req.body),
            statusCode,
            duration,
            success: statusCode < 400,
            ...(statusCode >= 400 && { error: responseData?.error }),
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        };

        // Log to database (non-blocking)
        setImmediate(async () => {
          try {
            await prisma.auditLog.create({
              data: auditData,
            });
          } catch (error) {
            console.error('Failed to create audit log:', error);
          }
        });

      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    });

    next();
  };
};

// Sanitize request body to remove sensitive information
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'passwordHash', 'token', 'otp', 'aadhaar'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Security event logging
export const securityAuditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const securityEvents = [
    '/auth/login',
    '/auth/register',
    '/auth/otp',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];

  const isSecurityEvent = securityEvents.some(event => req.path.includes(event));
  
  if (isSecurityEvent) {
    res.on('finish', async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId: (req as any).user?.id,
            action: `SECURITY_${req.method}_${req.path.replace('/', '').replace('/', '_').toUpperCase()}`,
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              success: res.statusCode < 400,
              timestamp: new Date().toISOString(),
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
          },
        });
      } catch (error) {
        console.error('Failed to create security audit log:', error);
      }
    });
  }

  next();
};

// Export audit utilities
export const auditLog = {
  // Manual audit logging for custom events
  log: async (data: AuditLogData) => {
    try {
      await prisma.auditLog.create({ data });
    } catch (error) {
      console.error('Failed to create manual audit log:', error);
    }
  },

  // Get audit logs for a user
  getUserLogs: async (userId: string, limit: number = 50) => {
    try {
      return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
      return [];
    }
  },

  // Get security events
  getSecurityEvents: async (timeRange: { start: Date; end: Date }, limit: number = 100) => {
    try {
      return await prisma.auditLog.findMany({
        where: {
          action: { startsWith: 'SECURITY_' },
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }
  },
};