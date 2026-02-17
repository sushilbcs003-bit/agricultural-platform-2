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
