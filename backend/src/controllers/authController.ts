import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { ApiError } from '../utils/apiError';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
const requestOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number'),
  }),
});

const verifyOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const registerFarmerSchema = z.object({
  body: z.object({
    phone: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    aadhaar: z.string().length(12, 'Aadhaar must be 12 digits'),
    district: z.string().min(1, 'District is required'),
    state: z.string().min(1, 'State is required'),
    village: z.string().optional(),
    landAreaValue: z.number().positive().optional(),
    landAreaUnit: z.enum(['BIGHA', 'HECTARE', 'ACRE']).optional(),
  }),
});

const registerBuyerSchema = z.object({
  body: z.object({
    gst: z.string().length(15, 'GST must be 15 characters'),
    businessName: z.string().min(2, 'Business name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string(),
    contactPerson: z.string().optional(),
  }),
});

export class AuthController {
  // Request OTP for phone verification
  static async requestOTP(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(requestOTPSchema, req);
      
      const { phone } = req.body;
      const result = await authService.requestOTP(phone);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP
  static async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(verifyOTPSchema, req);
      
      const { phone, otp } = req.body;
      const result = await authService.verifyOTP(phone, otp);
      
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Register farmer
  static async registerFarmer(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(registerFarmerSchema, req);
      
      const farmerData = req.body;
      const result = await authService.registerFarmer(farmerData);
      
      res.status(201).json({
        success: true,
        message: 'Farmer registered successfully',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // Register buyer
  static async registerBuyer(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(registerBuyerSchema, req);
      
      const buyerData = req.body;
      const result = await authService.registerBuyer(buyerData);
      
      res.status(201).json({
        success: true,
        message: 'Buyer registered successfully. Please verify your email.',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Login with GST and password (buyers)
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { gst, password } = req.body;
      
      if (!gst || !password) {
        throw new ApiError(400, 'GST and password are required');
      }
      
      const result = await authService.loginBuyer(gst, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = (req as any).sessionId;
      
      if (sessionId) {
        await authService.logout(sessionId);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        throw new ApiError(400, 'Invalid verification token');
      }
      
      await authService.verifyEmail(token);
      
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ApiError(400, 'Email is required');
      }
      
      await authService.forgotPassword(email);
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        throw new ApiError(400, 'Token and password are required');
      }
      
      await authService.resetPassword(token, password);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}