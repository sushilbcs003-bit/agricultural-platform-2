import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Admin Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError: any) {
      return res.status(400).json({
        success: false,
        error: { message: validationError.errors?.[0]?.message || 'Invalid input' },
      });
    }

    // Find admin user by email
    const admin = await prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN',
        isActive: true,
      },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    // Verify password
    if (!admin.passwordHash) {
      return res.status(401).json({
        success: false,
        error: { message: 'Password not set. Please contact administrator.' },
      });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Return admin data (without sensitive info)
    const adminData = {
      id: admin.id,
      role: admin.role,
      email: admin.email,
      phone: admin.phone,
      name: admin.name,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };

    res.json({
      success: true,
      admin: adminData,
      token,
      message: 'Admin login successful',
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Admin login failed' },
    });
  }
});

// Get Admin Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    // Verify admin token (in production, use proper middleware)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    // Get statistics
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalSuppliers,
      totalProducts,
      totalBids,
      totalOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'FARMER', isActive: true } }),
      prisma.user.count({ where: { role: 'BUYER', isActive: true } }),
      prisma.user.count({ where: { role: 'SUPPLIER', isActive: true } }),
      prisma.product.count(),
      prisma.bid.count(),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          farmers: totalFarmers,
          buyers: totalBuyers,
          suppliers: totalSuppliers,
        },
        products: {
          total: totalProducts,
        },
        bids: {
          total: totalBids,
        },
        orders: {
          total: totalOrders,
        },
      },
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch dashboard data' },
    });
  }
});

export default router;
