import { Request, Response, NextFunction } from 'express';
import { bidService } from '../services/bidService';
import { ApiError } from '../utils/apiError';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';

const createBidSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    offeredPrice: z.number().positive('Offered price must be positive'),
    quantity: z.number().positive('Quantity must be positive'),
    message: z.string().max(500).optional(),
  }),
});

const updateBidSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED', 'COUNTERED']),
    counterPrice: z.number().positive().optional(),
    message: z.string().max(500).optional(),
  }),
});

const counterBidSchema = z.object({
  body: z.object({
    counterPrice: z.number().positive('Counter price must be positive'),
    message: z.string().max(500).optional(),
  }),
});

export class BidController {
  // Create bid (Buyer only)
  static async createBid(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(createBidSchema, req);
      
      const buyerId = (req as any).user.id;
      const bidData = { ...req.body, buyerId };
      
      const bid = await bidService.createBid(bidData);
      
      res.status(201).json({
        success: true,
        message: 'Bid placed successfully',
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all bids for a product (Farmer only, own products)
  static async getProductBids(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const farmerId = (req as any).user.id;
      const { page = 1, limit = 20, status } = req.query;
      
      if (!productId) {
        throw new ApiError(400, 'Product ID is required');
      }
      
      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      };
      
      const bids = await bidService.getProductBids(productId, farmerId, filters);
      
      res.status(200).json({
        success: true,
        data: bids,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get buyer's bids
  static async getBuyerBids(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = (req as any).user.id;
      const { page = 1, limit = 20, status } = req.query;
      
      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      };
      
      const bids = await bidService.getBuyerBids(buyerId, filters);
      
      res.status(200).json({
        success: true,
        data: bids,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update bid status (Farmer only)
  static async updateBidStatus(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(updateBidSchema, req);
      
      const { bidId } = req.params;
      const farmerId = (req as any).user.id;
      const updateData = req.body;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const bid = await bidService.updateBidStatus(bidId, farmerId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Bid status updated successfully',
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Counter bid (Buyer only)
  static async counterBid(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(counterBidSchema, req);
      
      const { bidId } = req.params;
      const buyerId = (req as any).user.id;
      const counterData = req.body;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const bid = await bidService.counterBid(bidId, buyerId, counterData);
      
      res.status(200).json({
        success: true,
        message: 'Counter bid placed successfully',
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Accept counter bid (Farmer only)
  static async acceptCounterBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = req.params;
      const farmerId = (req as any).user.id;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const bid = await bidService.acceptCounterBid(bidId, farmerId);
      
      res.status(200).json({
        success: true,
        message: 'Counter bid accepted successfully',
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reject counter bid (Farmer only)
  static async rejectCounterBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = req.params;
      const farmerId = (req as any).user.id;
      const { message } = req.body;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const bid = await bidService.rejectCounterBid(bidId, farmerId, message);
      
      res.status(200).json({
        success: true,
        message: 'Counter bid rejected',
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get bid details
  static async getBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = req.params;
      const userId = (req as any).user.id;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const bid = await bidService.getBidById(bidId, userId);
      
      res.status(200).json({
        success: true,
        data: bid,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete bid (Buyer only, own bids, only if PENDING)
  static async deleteBid(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = req.params;
      const buyerId = (req as any).user.id;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      await bidService.deleteBid(bidId, buyerId);
      
      res.status(200).json({
        success: true,
        message: 'Bid deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get bid history
  static async getBidHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { bidId } = req.params;
      const userId = (req as any).user.id;
      
      if (!bidId) {
        throw new ApiError(400, 'Bid ID is required');
      }
      
      const history = await bidService.getBidHistory(bidId, userId);
      
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}