#!/bin/bash

echo "🌱 Setting up complete Agricultural Platform application files..."

# Create all the source files we need
# I'll create the key files needed for farmer/buyer registration

# 1. Main application index.ts
cat > backend/src/index.ts << 'BACKEND_INDEX'
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express application
const app: Application = express();

// Basic middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Agricultural Platform API 🌱',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint not found',
      statusCode: 404,
      path: req.originalUrl,
    },
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      statusCode: err.statusCode || 500,
    },
  });
});

// Database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🚀 Agricultural Platform API is running on port ${port}`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
      console.log(`📱 API endpoints: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
BACKEND_INDEX

echo "✅ Created main application file"

# 2. Auth routes
mkdir -p backend/src/routes
cat > backend/src/routes/auth.ts << 'AUTH_ROUTES'
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

// Request OTP endpoint
router.post('/otp/request', async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Validate phone number
    phoneSchema.parse(phone);
    
    // Generate OTP (in production, send via SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    await prisma.oTP.create({
      data: {
        phone,
        otp,
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
    const validOTP = await prisma.oTP.findFirst({
      where: {
        phone,
        otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!validOTP) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' },
      });
    }
    
    // Mark OTP as verified
    await prisma.oTP.update({
      where: { id: validOTP.id },
      data: { verified: true },
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
      district,
      state,
      pincode,
      about,
      landAreaValue,
      landAreaUnit,
    } = req.body;
    
    // Validate phone was verified
    const verifiedOTP = await prisma.oTP.findFirst({
      where: {
        phone,
        verified: true,
        createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // Within last 30 minutes
      },
    });
    
    if (!verifiedOTP) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number not verified' },
      });
    }
    
    // Create user and farmer profile
    const user = await prisma.user.create({
      data: {
        role: 'FARMER',
        name,
        phone,
        phoneVerified: true,
        farmerProfile: {
          create: {
            aadhaar,
            village,
            district,
            state,
            pincode,
            about,
            landAreaValue: landAreaValue ? parseFloat(landAreaValue) : null,
            landAreaUnit,
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
    
    res.status(201).json({
      success: true,
      user,
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
AUTH_ROUTES

echo "✅ Created auth routes"

# 3. User routes
cat > backend/src/routes/users.ts << 'USER_ROUTES'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // In a real app, you'd get userId from JWT middleware
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        providerProfile: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }
    
    res.json({
      success: true,
      user,
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

export default router;
USER_ROUTES

echo "✅ Created user routes"

# 4. Product routes
cat > backend/src/routes/products.ts << 'PRODUCT_ROUTES'
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            farmerProfile: {
              select: {
                district: true,
                state: true,
              },
            },
          },
        },
        category: true,
        _count: {
          select: {
            buyerBids: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    res.json({
      success: true,
      products,
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
});

export default router;
PRODUCT_ROUTES

echo "✅ Created product routes"

# 5. Updated Dockerfile for TypeScript
cat > backend/Dockerfile << 'DOCKERFILE'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S agricultural -u 1001
RUN chown -R agricultural:nodejs /app
USER agricultural

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]
DOCKERFILE

echo "✅ Created production Dockerfile"

echo ""
echo "🎉 All application files created!"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x setup-app-files.sh && ./setup-app-files.sh"
echo "2. Run: docker compose down && docker compose build --no-cache"
echo "3. Run: docker compose up -d"
echo "4. Setup database: docker compose exec backend npx prisma migrate dev --name init"
