import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number');
const otpSchema = z.string().length(6, 'OTP must be 6 digits');

// Check if phone number exists
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number format
    try {
      phoneSchema.parse(phone);
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        error: { message: validationError.message || 'Invalid phone number format' },
      });
    }
    
    // Check if user exists with this phone number
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });
    
    res.json({
      success: true,
      exists: !!existingUser,
      phone,
    });
  } catch (error: any) {
    console.error('Error checking phone:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to validate phone number. Please try again.' },
    });
  }
});

// Request OTP endpoint
router.post('/otp/request', async (req, res) => {
  try {
    const { phone, purpose = 'LOGIN' } = req.body;
    
    // Validate phone number
    phoneSchema.parse(phone);
    
    // Validate purpose
    const validPurposes = ['LOGIN', 'REGISTRATION'];
    const normalizedPurpose = purpose.toUpperCase();
    if (!validPurposes.includes(normalizedPurpose)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid purpose. Must be LOGIN or REGISTRATION' },
      });
    }
    
    // Generate OTP (in production, send via SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database (normalize to lowercase for consistency)
    const dbPurpose = normalizedPurpose === 'REGISTRATION' ? 'registration' : 'login';
    await prisma.otp.create({
      data: {
        phone,
        code: otp,
        purpose: dbPurpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    
    console.log(`📱 OTP for ${phone}: ${otp}`); // In production, send SMS
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to send OTP' },
    });
  }
});

// Verify OTP endpoint
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    // Validate inputs
    phoneSchema.parse(phone);
    otpSchema.parse(otp);
    
    // Find valid OTP
    const validOTP = await prisma.otp.findFirst({
      where: {
        phone,
        code: otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!validOTP) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' },
      });
    }
    
    // Mark OTP as used
    await prisma.otp.update({
      where: { id: validOTP.id },
      data: { isUsed: true },
    });
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      include: {
        farmerProfile: true,
        buyerProfile: true,
      },
    });
    
    if (existingUser) {
      // Generate JWT for existing user
      const token = jwt.sign(
        { userId: existingUser.id, role: existingUser.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        user: existingUser,
        token,
        message: 'Login successful',
      });
    }
    
    // New user - return verification success
    res.json({
      success: true,
      message: 'OTP verified successfully',
      newUser: true,
      phone,
    });
    
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'OTP verification failed' },
    });
  }
});

// Register Farmer
router.post('/register/farmer', async (req, res) => {
  try {
    const {
      phone,
      name,
      aadhaar,
      village,
      tehsil,
      district,
      state,
      pincode,
      about,
      landAreaValue,
      landAreaUnit,
    } = req.body;
    
    // Validate phone was verified
    const verifiedOTP = await prisma.otp.findFirst({
      where: {
        phone,
        isUsed: true,
        purpose: 'registration',
        createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // Within last 30 minutes
      },
    });
    
    if (!verifiedOTP) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number not verified' },
      });
    }
    
    // Encrypt Aadhaar before storing (using simple base64 for now - in production use proper encryption)
    // In production, use: const crypto = require('crypto'); and proper encryption
    const aadhaarEncrypted = Buffer.from(aadhaar).toString('base64'); // Simple encoding - replace with proper encryption in production
    
    // Valid enum values from Prisma schema
    const VALID_IRRIGATION_SOURCES = ['RAINWATER', 'TUBE_WELL', 'CANAL', 'RIVER', 'POND', 'OTHER'];
    const VALID_OWNERSHIP_TYPES = ['OWNED', 'LEASED', 'SHARED'];
    
    // Validate and normalize irrigation source
    const normalizeIrrigationSource = (source: string | undefined): string | null => {
      if (!source || !source.trim()) return null;
      const upper = source.toUpperCase().trim();
      const mapping: Record<string, string> = {
        'BOREWELL': 'TUBE_WELL',
        'TUBEWELL': 'TUBE_WELL',
        'WELL': 'TUBE_WELL',
        'RAIN': 'RAINWATER',
        'RAIN WATER': 'RAINWATER',
        'RAINFED': 'RAINWATER'
      };
      const normalized = mapping[upper] || upper;
      return VALID_IRRIGATION_SOURCES.includes(normalized) ? normalized : null;
    };
    
    // Validate and normalize ownership type
    const normalizeOwnershipType = (type: string | undefined): string | null => {
      if (!type || !type.trim()) return null;
      const upper = type.toUpperCase().trim();
      return VALID_OWNERSHIP_TYPES.includes(upper) ? upper : null;
    };
    
    // Extract additional fields from request body
    const {
      mainRoadConnectivity,
      irrigationSource,
      ownershipType,
    } = req.body;
    
    // Create user and farmer profile
    // Aadhaar is stored in User.aadhaarEncrypted, NOT in FarmerProfile
    const user = await prisma.user.create({
      data: {
        role: 'FARMER',
        name,
        phone,
        phoneVerified: true,
        aadhaarEncrypted: aadhaarEncrypted, // Store encrypted Aadhaar in User model
        farmerProfile: {
          create: {
            // Note: aadhaar is NOT stored in FarmerProfile - it's in User.aadhaarEncrypted
            village,
            tehsil,
            district,
            state,
            pincode,
            about,
            mainRoadConnectivity: mainRoadConnectivity || false,
            landAreaValue: landAreaValue ? parseFloat(landAreaValue) : null,
            landAreaUnit,
            irrigationSource: normalizeIrrigationSource(irrigationSource),
            ownershipType: normalizeOwnershipType(ownershipType),
          },
        },
      },
      include: {
        farmerProfile: true,
      },
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    // Remove sensitive data from response - never return raw Aadhaar
    const safeUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      farmerProfile: user.farmerProfile,
      // aadhaarEncrypted is NOT included in response for security
    };
    
    res.status(201).json({
      success: true,
      user: safeUser,
      token,
      message: 'Farmer registered successfully',
    });
    
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Registration failed' },
    });
  }
});

// Register Buyer
router.post('/register/buyer', async (req, res) => {
  try {
    const {
      gst,
      businessName,
      email,
      password,
      phone,
      businessAddress,
      village,
      tehsil,
      district,
      state,
      pincode,
      contactPerson,
    } = req.body;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user and buyer profile
    const user = await prisma.user.create({
      data: {
        role: 'BUYER',
        name: businessName,
        email,
        phone,
        passwordHash,
        emailVerified: false,
        phoneVerified: false,
        buyerProfile: {
          create: {
            gst,
            businessName,
            businessAddress,
            village,
            tehsil,
            district,
            state,
            pincode,
            contactPerson,
          },
        },
      },
      include: {
        buyerProfile: true,
      },
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        buyerProfile: user.buyerProfile,
      },
      message: 'Buyer registered successfully. Please verify your email.',
    });
    
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Registration failed' },
    });
  }
});

// Buyer Login
router.post('/login', async (req, res) => {
  try {
    const { gst, password } = req.body;
    
    // Find user by GST
    const user = await prisma.user.findFirst({
      where: {
        buyerProfile: { gst },
      },
      include: {
        buyerProfile: true,
      },
    });
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      user,
      token,
      message: 'Login successful',
    });
    
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Login failed' },
    });
  }
});

export default router;
