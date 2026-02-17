// Initialize OpenTelemetry BEFORE any other imports
import './tracing';

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
import bidRoutes from './routes/bids';
import machineryRoutes from './routes/machinery';
import cartRoutes from './routes/cart';
import locationRoutes from './routes/location';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';

// Import tracing middleware
import { tracingMiddleware } from './middleware/tracing';

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

// OpenTelemetry tracing middleware (must be before routes)
app.use(tracingMiddleware);

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
app.use('/api/bids', bidRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

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
