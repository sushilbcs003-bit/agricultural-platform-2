import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { generateTokens, blacklistSession } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { encrypt } from '../utils/encryption';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

export class AuthService {
  // Request OTP for phone verification
  async requestOTP(phone: string) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTP for this phone
      await prisma.otp.deleteMany({
        where: { phone, purpose: 'registration' },
      });

      // Create new OTP
      await prisma.otp.create({
        data: {
          phone,
          code: otp,
          purpose: 'registration',
          expiresAt,
        },
      });

      // Send OTP via SMS (using notification service)
      await notificationService.sendSMS(phone, `Your OTP is: ${otp}. Valid for 10 minutes.`);

      return {
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to send OTP');
    }
  }

  // Verify OTP
  async verifyOTP(phone: string, otp: string) {
    try {
      const otpRecord = await prisma.otp.findFirst({
        where: {
          phone,
          code: otp,
          purpose: 'registration',
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        throw new ApiError(400, 'Invalid or expired OTP');
      }

      // Mark OTP as used
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { phone },
        include: {
          farmerProfile: true,
          buyerProfile: true,
          supplierProfile: true,
        },
      });

      if (existingUser) {
        // Generate tokens for existing user
        const tokens = await generateTokens(existingUser.id, existingUser.role);
        
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            phone: existingUser.phone,
            role: existingUser.role,
            profile: existingUser.farmerProfile || existingUser.buyerProfile || existingUser.supplierProfile,
          },
        };
      }

      // Return success for new user (they'll need to complete registration)
      return {
        verified: true,
        phone,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to verify OTP');
    }
  }

  // Register farmer
  async registerFarmer(data: any) {
    try {
      // Check if phone is already registered
      const existingUser = await prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingUser) {
        throw new ApiError(409, 'Phone number already registered');
      }

      // Check if Aadhaar is already registered
      const existingAadhaar = await prisma.user.findFirst({
        where: { aadhaarEncrypted: encrypt(data.aadhaar) },
      });

      if (existingAadhaar) {
        throw new ApiError(409, 'Aadhaar number already registered');
      }

      // Create user and farmer profile in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role: 'FARMER',
            name: data.name,
            phone: data.phone,
            phoneVerified: true,
            aadhaarEncrypted: encrypt(data.aadhaar),
          },
        });

        const farmerProfile = await tx.farmerProfile.create({
          data: {
            userId: user.id,
            village: data.village,
            tehsil: data.tehsil,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            about: data.about,
            landAreaValue: data.landAreaValue,
            landAreaUnit: data.landAreaUnit,
            irrigationSource: data.irrigationSource,
            ownershipType: data.ownershipType,
          },
        });

        return { user, farmerProfile };
      });

      // Generate tokens
      const tokens = await generateTokens(result.user.id, result.user.role);

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          role: result.user.role,
          profile: result.farmerProfile,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to register farmer');
    }
  }

  // Register buyer
  async registerBuyer(data: any) {
    try {
      // Check if GST is already registered
      const existingGST = await prisma.user.findUnique({
        where: { gst: data.gst },
      });

      if (existingGST) {
        throw new ApiError(409, 'GST number already registered');
      }

      // Check if email is already registered
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ApiError(409, 'Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user and buyer profile in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role: 'BUYER',
            name: data.businessName,
            phone: data.phone,
            email: data.email,
            passwordHash,
            gst: data.gst,
          },
        });

        const buyerProfile = await tx.buyerProfile.create({
          data: {
            userId: user.id,
            businessName: data.businessName,
            businessAddress: data.businessAddress,
            village: data.village,
            tehsil: data.tehsil,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            contactPerson: data.contactPerson,
            businessType: data.businessType,
          },
        });

        // Create email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await tx.emailVerification.create({
          data: {
            userId: user.id,
            email: data.email,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });

        return { user, buyerProfile, verificationToken };
      });

      // Send verification email
      await notificationService.sendEmail(
        data.email,
        'Verify Your Email',
        `Please click this link to verify your email: ${process.env.FRONTEND_URL}/verify-email?token=${result.verificationToken}`
      );

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          profile: result.buyerProfile,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to register buyer');
    }
  }

  // Login buyer with GST and password
  async loginBuyer(gst: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { gst },
        include: {
          buyerProfile: true,
        },
      });

      if (!user || user.role !== 'BUYER') {
        throw new ApiError(401, 'Invalid credentials');
      }

      if (!user.passwordHash) {
        throw new ApiError(401, 'Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
      }

      if (!user.emailVerified) {
        throw new ApiError(401, 'Please verify your email before logging in');
      }

      // Generate tokens
      const tokens = await generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.buyerProfile,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Login failed');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify and decode refresh token
      // Implementation depends on your JWT setup
      // This is a simplified version
      
      throw new ApiError(501, 'Refresh token functionality not implemented');
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  // Logout user
  async logout(sessionId: string) {
    try {
      await blacklistSession(sessionId);
    } catch (error) {
      throw new ApiError(500, 'Logout failed');
    }
  }

  // Verify email
  async verifyEmail(token: string) {
    try {
      const verification = await prisma.emailVerification.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!verification || verification.isUsed || verification.expiresAt < new Date()) {
        throw new ApiError(400, 'Invalid or expired verification token');
      }

      // Update user and mark verification as used
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: verification.userId },
          data: { emailVerified: true },
        });

        await tx.emailVerification.update({
          where: { id: verification.id },
          data: { isUsed: true },
        });
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Email verification failed');
    }
  }

  // Forgot password
  async forgotPassword(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Store reset token (you'll need to create a password_resets table)
      // For now, we'll use a simple approach
      
      // Send reset email
      await notificationService.sendEmail(
        email,
        'Password Reset',
        `Click this link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      );
    } catch (error) {
      throw new ApiError(500, 'Failed to process password reset');
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token and update password
      // Implementation depends on your reset token storage
      throw new ApiError(501, 'Password reset functionality not implemented');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Password reset failed');
    }
  }
}

export const authService = new AuthService();