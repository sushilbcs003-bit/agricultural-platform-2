import { Router } from 'express';
import { paymentProfileController } from '../controllers/paymentProfileController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payment profile routes
// GET /api/payment/:role/:id/profile
// PUT /api/payment/:role/:id/profile
router.get('/:role/:id/profile', paymentProfileController.getPaymentProfile.bind(paymentProfileController));
router.put('/:role/:id/profile', paymentProfileController.updatePaymentProfile.bind(paymentProfileController));

export default router;
