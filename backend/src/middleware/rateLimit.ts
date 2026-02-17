import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';

// Create Redis client for rate limiting
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis rate limit client error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis rate limit client connected');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      success: false,
      error: {
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_AUTH',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // OTP requests - very strict
  otp: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 OTP requests per hour
    message: {
      success: false,
      error: {
        message: 'Too many OTP requests. Please try again in 1 hour.',
        code: 'RATE_LIMIT_OTP',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // General API - moderate limits
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      success: false,
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_API',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload - strict limits
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 uploads per window
    message: {
      success: false,
      error: {
        message: 'Too many file uploads. Please try again in 10 minutes.',
        code: 'RATE_LIMIT_UPLOAD',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Bidding - moderate limits
  bidding: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 bids per 5 minutes
    message: {
      success: false,
      error: {
        message: 'Too many bidding attempts. Please slow down.',
        code: 'RATE_LIMIT_BIDDING',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Product creation - moderate limits
  product: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 products per 10 minutes
    message: {
      success: false,
      error: {
        message: 'Too many product creations. Please wait before creating more products.',
        code: 'RATE_LIMIT_PRODUCT',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Password reset - strict limits
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: {
      success: false,
      error: {
        message: 'Too many password reset attempts. Please try again in 1 hour.',
        code: 'RATE_LIMIT_PASSWORD_RESET',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Email verification - moderate limits
  emailVerification: {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5, // 5 verification emails per 30 minutes
    message: {
      success: false,
      error: {
        message: 'Too many verification email requests. Please try again in 30 minutes.',
        code: 'RATE_LIMIT_EMAIL_VERIFICATION',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Search - lenient limits
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
      success: false,
      error: {
        message: 'Too many search requests. Please slow down.',
        code: 'RATE_LIMIT_SEARCH',
        statusCode: 429,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Key generator function - includes user ID if authenticated
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Use user ID if authenticated, otherwise use IP
  return userId ? `user:${userId}` : `ip:${ip}`;
};

// Skip function - skip rate limiting for certain conditions
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  // Skip if response is successful (2xx status code)
  return res.statusCode < 400;
};

// Skip function for admin users
const skipAdminUsers = (req: Request, res: Response): boolean => {
  const user = (req as any).user;
  return user && user.role === 'ADMIN';
};

// Create rate limiter with Redis store
const createRateLimiter = (type: keyof typeof RATE_LIMIT_CONFIGS, customOptions: any = {}) => {
  const config = RATE_LIMIT_CONFIGS[type];
  
  return rateLimit({
    store: new RedisStore({
      // Redis connection
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    keyGenerator,
    ...config,
    ...customOptions,
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${keyGenerator(req)} on ${req.path}`, {
        ip: req.ip,
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      const message = customOptions.message || config.message;
      res.status(429).json(message);
    },
  });
};

// Pre-configured rate limiters
export const authRateLimit = createRateLimiter('auth');
export const otpRateLimit = createRateLimiter('otp');
export const apiRateLimit = createRateLimiter('api');
export const uploadRateLimit = createRateLimiter('upload');
export const biddingRateLimit = createRateLimiter('bidding');
export const productRateLimit = createRateLimiter('product');
export const passwordResetRateLimit = createRateLimiter('passwordReset');
export const emailVerificationRateLimit = createRateLimiter('emailVerification');
export const searchRateLimit = createRateLimiter('search');

// Generic rate limiting middleware
export const rateLimitMiddleware = (
  type: keyof typeof RATE_LIMIT_CONFIGS,
  max?: number,
  windowMs?: number
) => {
  const customOptions: any = {};
  
  if (max !== undefined) customOptions.max = max;
  if (windowMs !== undefined) customOptions.windowMs = windowMs;
  
  return createRateLimiter(type, customOptions);
};

// Advanced rate limiting with different limits based on user type
export const tieredRateLimit = (config: {
  guest: { max: number; windowMs: number };
  user: { max: number; windowMs: number };
  premium?: { max: number; windowMs: number };
}) => {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    let rateLimitConfig;

    if (!user) {
      // Guest user
      rateLimitConfig = config.guest;
    } else if (user.isPremium && config.premium) {
      // Premium user
      rateLimitConfig = config.premium;
    } else {
      // Regular authenticated user
      rateLimitConfig = config.user;
    }

    const limiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      }),
      keyGenerator,
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      message: {
        success: false,
        error: {
          message: 'Rate limit exceeded. Please slow down.',
          code: 'RATE_LIMIT_TIERED',
          statusCode: 429,
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    limiter(req, res, next);
  };
};

// Burst protection - allows short bursts but enforces longer-term limits
export const burstProtection = (config: {
  burst: { max: number; windowMs: number };
  sustained: { max: number; windowMs: number };
}) => {
  const burstLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'burst:',
    }),
    keyGenerator,
    windowMs: config.burst.windowMs,
    max: config.burst.max,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: {
        message: 'Too many requests in a short period. Please slow down.',
        code: 'RATE_LIMIT_BURST',
        statusCode: 429,
      },
    },
  });

  const sustainedLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'sustained:',
    }),
    keyGenerator,
    windowMs: config.sustained.windowMs,
    max: config.sustained.max,
    message: {
      success: false,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_SUSTAINED',
        statusCode: 429,
      },
    },
  });

  return [burstLimiter, sustainedLimiter];
};

// Rate limit based on endpoint sensitivity
export const sensitiveEndpointRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'sensitive:',
  }),
  keyGenerator,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Very strict limit for sensitive operations
  message: {
    success: false,
    error: {
      message: 'Too many requests to sensitive endpoint. Access temporarily restricted.',
      code: 'RATE_LIMIT_SENSITIVE',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Geographic rate limiting (placeholder for future enhancement)
export const geoRateLimit = (allowedCountries: string[] = []) => {
  return (req: Request, res: Response, next: Function) => {
    // Placeholder for geo-based rate limiting
    // Would integrate with IP geolocation service
    next();
  };
};

// Rate limit bypass for trusted IPs
export const trustedIpBypass = (trustedIPs: string[] = []) => {
  return (req: Request, res: Response, next: Function) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (trustedIPs.includes(clientIp || '')) {
      // Skip rate limiting for trusted IPs
      return next();
    }
    
    next();
  };
};

// Monitoring and alerting for rate limit violations
export const rateLimitMonitoring = (threshold: number = 10) => {
  let violationCount = 0;
  const resetInterval = 60 * 1000; // Reset every minute

  setInterval(() => {
    if (violationCount >= threshold) {
      console.error(`High rate limit violations detected: ${violationCount} in the last minute`);
      // Here you could integrate with alerting systems (Slack, email, etc.)
    }
    violationCount = 0;
  }, resetInterval);

  return (req: Request, res: Response, next: Function) => {
    res.on('finish', () => {
      if (res.statusCode === 429) {
        violationCount++;
      }
    });
    next();
  };
};

// Rate limit info middleware - adds rate limit info to response headers
export const rateLimitInfo = (req: Request, res: Response, next: Function) => {
  // Add custom rate limit information to response
  res.on('finish', () => {
    const remaining = res.get('X-RateLimit-Remaining');
    const limit = res.get('X-RateLimit-Limit');
    const reset = res.get('X-RateLimit-Reset');

    if (remaining && limit && reset) {
      // Log rate limit status for monitoring
      console.log(`Rate limit status for ${keyGenerator(req)}: ${remaining}/${limit}, resets at ${reset}`);
    }
  });

  next();
};

// Export Redis client for other rate limiting needs
export { redisClient as rateLimitRedis };

// Health check for rate limiting service
export const rateLimitHealthCheck = async (): Promise<{ status: string; redis: string }> => {
  try {
    await redisClient.ping();
    return {
      status: 'healthy',
      redis: 'connected',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      redis: 'disconnected',
    };
  }
};

// Cleanup function for graceful shutdown
export const cleanupRateLimit = async () => {
  try {
    await redisClient.quit();
    console.log('Rate limit Redis client disconnected');
  } catch (error) {
    console.error('Error disconnecting rate limit Redis client:', error);
  }
};