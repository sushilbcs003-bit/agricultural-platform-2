import { Router } from 'express';
import { BidController } from '../controllers/bidController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Buyer routes
router.post('/', requireRole('BUYER'), BidController.createBid);
router.get('/my-bids', requireRole('BUYER'), BidController.getBuyerBids);
router.put('/:bidId/counter', requireRole('BUYER'), BidController.counterBid);
router.delete('/:bidId', requireRole('BUYER'), BidController.deleteBid);

// Farmer routes
router.get('/product/:productId', requireRole('FARMER'), BidController.getProductBids);
router.put('/:bidId/status', requireRole('FARMER'), BidController.updateBidStatus);
router.put('/:bidId/accept-counter', requireRole('FARMER'), BidController.acceptCounterBid);
router.put('/:bidId/reject-counter', requireRole('FARMER'), BidController.rejectCounterBid);

// Shared routes (both buyer and farmer can access their own bids)
router.get('/:bidId', BidController.getBid);
router.get('/:bidId/history', BidController.getBidHistory);

export default router;