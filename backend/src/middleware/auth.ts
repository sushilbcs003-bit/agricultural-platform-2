import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { config } from '../config/config';
import { logger, securityLogger } from '../config/logger';
import { ApiError } from '../utils/apiError';
import { redis } from '../index';

const prisma = new PrismaClient();

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
  userRole?: UserRole;
  sessionId?: string;
}

// JWT payload interface
interface JwtPayload {
  userId: string;
  sessionId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookies (for web sessions)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};

// Verify JWT token
const verifyToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as JwtPayload);
      }
    });
  });
};

// Check if session is blacklisted
const isSessionBlacklisted = async (sessionId: string): Promise<boolean> => {
  try {
    const result = await redis.get(`blacklist:${sessionId}`);
    return result !== null;
  } catch (error) {
    logger.error('Error checking session blacklist:', error);
    return false;
  }
};

// Main authentication middleware
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      securityLogger.info('Authentication failed - No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      throw new ApiError(401, 'Access token required');
    }

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      securityLogger.warn('Authentication failed - Invalid token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw new ApiError(401, 'Invalid or expired token');
    }

    // Check if session is blacklisted
    if (await isSessionBlacklisted(decoded.sessionId)) {
      securityLogger.warn('Authentication failed - Session blacklisted', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new ApiError(401, 'Session expired or revoked');
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        supplierProfile: true,
      },
    });

    if (!user || !user.isActive) {
      securityLogger.warn('Authentication failed - User not found or inactive', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new ApiError(401, 'User not found or account deactivated');
    }

    // Verify session exists in database
    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sessionId,
        userId: user.id,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      securityLogger.warn('Authentication failed - Session not found or expired', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      throw new ApiError(401, 'Session expired or invalid');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Attach user info to request
    req.user = user;
    req.userRole = user.role;
    req.sessionId = decoded.sessionId;

    // Log successful authentication
    securityLogger.info('Authentication successful', {
      userId: user.id,
      role: user.role,
      sessionId: decoded.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: 'AUTHENTICATION_FAILED',
      });
    } else {
      logger.error('Authentication middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
};

// Optional authentication middleware (doesn't throw error if no token)
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      // Use the main auth middleware logic if token is present
      await authMiddleware(req, res, next);
    } else {
      // Continue without authentication
      next();
    }
  } catch (error) {
    // For optional auth, we just continue without setting user
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      securityLogger.warn('Authorization failed - Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const resourceId = req.params[resourceParam];
    
    if (!resourceId) {
      res.status(400).json({
        success: false,
        message: 'Resource ID required',
        code: 'RESOURCE_ID_REQUIRED',
      });
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // For farmers, check if they own the resource
    if (req.user.role === 'FARMER') {
      try {
        // Check product ownership
        if (req.baseUrl.includes('/products')) {
          const product = await prisma.product.findFirst({
            where: {
              id: resourceId,
              farmerId: req.user.id,
            },
          });
          
          if (!product) {
            res.status(403).json({
              success: false,
              message: 'You can only access your own products',
              code: 'RESOURCE_ACCESS_DENIED',
            });
            return;
          }
        }
      } catch (error) {
        logger.error('Ownership check error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        });
        return;
      }
    }

    next();
  };
};

// Blacklist token/session
export const blacklistSession = async (sessionId: string): Promise<void> => {
  try {
    // Add to Redis blacklist with TTL equal to token expiry
    await redis.setex(`blacklist:${sessionId}`, 24 * 60 * 60, 'true'); // 24 hours
    
    // Deactivate session in database
    await prisma.userSession.updateMany({
      where: { id: sessionId },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error('Error blacklisting session:', error);
    throw error;
  }
};

// Generate JWT token
export const generateTokens = async (
  userId: string,
  role: UserRole,
  deviceInfo?: any
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> => {
  try {
    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        userId,
        tokenHash: '', // Will be updated below
        refreshTokenHash: '', // Will be updated below
        deviceInfo,
        ipAddress: deviceInfo?.ipAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId,
        sessionId: session.id,
        role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        sessionId: session.id,
        role,
        type: 'refresh',
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Update session with token hashes
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        tokenHash: jwt.sign({ token: accessToken }, config.jwt.secret),
        refreshTokenHash: jwt.sign({ token: refreshToken }, config.jwt.refreshSecret),
      },
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  } catch (error) {
    logger.error('Error generating tokens:', error);
    throw error;
  }
};

export default authMiddleware;
