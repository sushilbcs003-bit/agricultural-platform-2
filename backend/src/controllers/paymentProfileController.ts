import { Request, Response } from 'express';
import { paymentProfileService } from '../services/paymentProfileService';
import { authenticate } from '../middleware/auth';

export class PaymentProfileController {
  // Get payment profile
  async getPaymentProfile(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;
      const { id } = req.params;

      // Users can only view their own payment profile
      if (id !== userId && role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' },
        });
      }

      const profile = await paymentProfileService.getPaymentProfile(id, role);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch payment profile' },
      });
    }
  }

  // Update payment profile
  async updatePaymentProfile(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;
      const { id } = req.params;

      // Users can only update their own payment profile
      if (id !== userId && role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' },
        });
      }

      const profile = await paymentProfileService.upsertPaymentProfile(
        id,
        role,
        req.body
      );

      res.json({
        success: true,
        data: profile,
        message: 'Payment profile updated successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to update payment profile' },
      });
    }
  }
}

export const paymentProfileController = new PaymentProfileController();
