import { Request, Response } from 'express';
import { machineryService } from '../services/machineryService';
import { authenticate } from '../middleware/auth';

export class MachineryController {
  // Get machinery types by category
  async getMachineryTypes(req: Request, res: Response) {
    try {
      const { category } = req.query;

      if (!category || (category !== 'FARMING' && category !== 'TRANSPORT')) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid category. Must be FARMING or TRANSPORT' },
        });
      }

      const types = await machineryService.getMachineryTypes(category as 'FARMING' | 'TRANSPORT');

      res.json({
        success: true,
        data: types,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch machinery types' },
      });
    }
  }

  // Get supplier machinery
  async getSupplierMachinery(req: Request, res: Response) {
    try {
      const { id: supplierId } = req.params;
      const { role, id: userId } = req.user!;

      // Verify access: supplier can only view own, admin can view any
      if (role === 'SUPPLIER' && supplierId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'You can only view your own machinery' },
        });
      }

      const machinery = await machineryService.getSupplierMachinery(supplierId);

      res.json({
        success: true,
        data: machinery,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch supplier machinery' },
      });
    }
  }

  // Add machinery
  async addMachinery(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;

      if (role !== 'SUPPLIER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Only suppliers can add machinery' },
        });
      }

      const machinery = await machineryService.addMachinery(userId, req.body);

      res.json({
        success: true,
        data: machinery,
        message: 'Machinery added successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to add machinery' },
      });
    }
  }

  // Update machinery
  async updateMachinery(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;
      const { machineryId } = req.params;

      if (role !== 'SUPPLIER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Only suppliers can update machinery' },
        });
      }

      const machinery = await machineryService.updateMachinery(
        userId,
        machineryId,
        req.body
      );

      res.json({
        success: true,
        data: machinery,
        message: 'Machinery updated successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to update machinery' },
      });
    }
  }

  // Delete machinery
  async deleteMachinery(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;
      const { machineryId } = req.params;

      if (role !== 'SUPPLIER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Only suppliers can delete machinery' },
        });
      }

      await machineryService.deleteMachinery(userId, machineryId);

      res.json({
        success: true,
        message: 'Machinery deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to delete machinery' },
      });
    }
  }

  // Browse farming machinery
  async browseFarmingMachinery(req: Request, res: Response) {
    try {
      const { role } = req.user!;

      if (role !== 'FARMER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Only farmers can browse farming machinery' },
        });
      }

      const filters: any = {};
      if (req.query.availability) filters.availability = req.query.availability;
      if (req.query.machineryTypeId) filters.machineryTypeId = req.query.machineryTypeId;
      if (req.query.latitude && req.query.longitude) {
        filters.location = {
          latitude: parseFloat(req.query.latitude as string),
          longitude: parseFloat(req.query.longitude as string),
          radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50,
        };
      }

      const machinery = await machineryService.browseFarmingMachinery(filters);

      res.json({
        success: true,
        data: machinery,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to browse farming machinery' },
      });
    }
  }

  // Browse transport machinery
  async browseTransportMachinery(req: Request, res: Response) {
    try {
      const { role, id: userId } = req.user!;

      if (role !== 'FARMER' && role !== 'BUYER') {
        return res.status(403).json({
          success: false,
          error: { message: 'Only farmers and buyers can browse transport machinery' },
        });
      }

      const filters: any = {};
      if (req.query.availability) filters.availability = req.query.availability;
      if (req.query.machineryTypeId) filters.machineryTypeId = req.query.machineryTypeId;
      if (req.query.hasRefrigeration !== undefined) {
        filters.hasRefrigeration = req.query.hasRefrigeration === 'true';
      }
      if (req.query.minCapacity) {
        filters.minCapacity = parseFloat(req.query.minCapacity as string);
      }
      if (req.query.latitude && req.query.longitude) {
        filters.location = {
          latitude: parseFloat(req.query.latitude as string),
          longitude: parseFloat(req.query.longitude as string),
          radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50,
        };
      }

      const machinery = await machineryService.browseTransportMachinery(
        userId,
        role,
        filters
      );

      res.json({
        success: true,
        data: machinery,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to browse transport machinery' },
      });
    }
  }
}

export const machineryController = new MachineryController();
