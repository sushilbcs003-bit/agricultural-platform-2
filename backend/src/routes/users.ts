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
