import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { ApiError } from '../utils/apiError';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    about: z.string().max(500).optional(),
    village: z.string().optional(),
    businessAddress: z.string().optional(),
    contactPerson: z.string().optional(),
    landAreaValue: z.number().positive().optional(),
    landAreaUnit: z.enum(['BIGHA', 'HECTARE', 'ACRE']).optional(),
  }),
});

export class UserController {
  // Get current user profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.getUserById(userId);
      
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(updateProfileSchema, req);
      
      const userId = (req as any).user.id;
      const updateData = req.body;
      
      const user = await userService.updateProfile(userId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload profile picture
  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const file = (req as any).file;
      
      if (!file) {
        throw new ApiError(400, 'No image file provided');
      }
      
      const user = await userService.updateAvatar(userId, file.path);
      
      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: { avatarUrl: user.avatarUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      
      const stats = await userService.getUserStats(userId, userRole);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's activity history
  static async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20 } = req.query;
      
      const activity = await userService.getUserActivity(userId, {
        page: Number(page),
        limit: Number(limit),
      });
      
      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;
      
      await userService.deleteAccount(userId, password);
      
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user notifications
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      
      const notifications = await userService.getNotifications(userId, {
        page: Number(page),
        limit: Number(limit),
        unreadOnly: unreadOnly === 'true',
      });
      
      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark notification as read
  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { notificationId } = req.params;
      
      await userService.markNotificationRead(userId, notificationId);
      
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      
      await userService.markAllNotificationsRead(userId);
      
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}