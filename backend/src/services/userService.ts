import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError';

const prisma = new PrismaClient();

export class UserService {
  // Get user by ID with profile
  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: true,
          buyerProfile: true,
          supplierProfile: true,
        },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Remove sensitive data
      const { passwordHash, aadhaarEncrypted, ...safeUser } = user;

      return {
        ...safeUser,
        profile: user.farmerProfile || user.buyerProfile || user.supplierProfile,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch user');
    }
  }

  // Update user profile
  async updateProfile(userId: string, updateData: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: true,
          buyerProfile: true,
          supplierProfile: true,
        },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Update user table fields
      const userUpdates: any = {};
      if (updateData.name) userUpdates.name = updateData.name;

      // Update profile based on user role
      const result = await prisma.$transaction(async (tx) => {
        // Update user table if there are changes
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: userUpdates,
          });
        }

        // Update profile table based on role
        if (user.role === 'FARMER' && user.farmerProfile) {
          const profileUpdates: any = {};
          if (updateData.about !== undefined) profileUpdates.about = updateData.about;
          if (updateData.village !== undefined) profileUpdates.village = updateData.village;
          if (updateData.landAreaValue !== undefined) profileUpdates.landAreaValue = updateData.landAreaValue;
          if (updateData.landAreaUnit !== undefined) profileUpdates.landAreaUnit = updateData.landAreaUnit;

          if (Object.keys(profileUpdates).length > 0) {
            await tx.farmerProfile.update({
              where: { userId },
              data: profileUpdates,
            });
          }
        } else if (user.role === 'BUYER' && user.buyerProfile) {
          const profileUpdates: any = {};
          if (updateData.businessAddress !== undefined) profileUpdates.businessAddress = updateData.businessAddress;
          if (updateData.contactPerson !== undefined) profileUpdates.contactPerson = updateData.contactPerson;

          if (Object.keys(profileUpdates).length > 0) {
            await tx.buyerProfile.update({
              where: { userId },
              data: profileUpdates,
            });
          }
        }

        // Get updated user
        return await tx.user.findUnique({
          where: { id: userId },
          include: {
            farmerProfile: true,
            buyerProfile: true,
            supplierProfile: true,
          },
        });
      });

      const { passwordHash, aadhaarEncrypted, ...safeUser } = result!;
      return {
        ...safeUser,
        profile: result!.farmerProfile || result!.buyerProfile || result!.supplierProfile,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update profile');
    }
  }

  // Update avatar
  async updateAvatar(userId: string, avatarUrl: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      return { avatarUrl: user.avatarUrl };
    } catch (error) {
      throw new ApiError(500, 'Failed to update avatar');
    }
  }

  // Get user statistics
  async getUserStats(userId: string, userRole: string) {
    try {
      let stats: any = {};

      if (userRole === 'FARMER') {
        const [productsCount, activeProducts, totalBids, acceptedBids] = await Promise.all([
          prisma.product.count({ where: { farmerId: userId } }),
          prisma.product.count({ where: { farmerId: userId, status: 'ACTIVE' } }),
          prisma.buyerBid.count({
            where: { product: { farmerId: userId } }
          }),
          prisma.buyerBid.count({
            where: { product: { farmerId: userId }, status: 'ACCEPTED' }
          }),
        ]);

        stats = {
          totalProducts: productsCount,
          activeProducts,
          totalBids,
          acceptedBids,
        };
      } else if (userRole === 'BUYER') {
        const [totalBids, pendingBids, acceptedBids, orders] = await Promise.all([
          prisma.buyerBid.count({ where: { buyerId: userId } }),
          prisma.buyerBid.count({ where: { buyerId: userId, status: 'PENDING' } }),
          prisma.buyerBid.count({ where: { buyerId: userId, status: 'ACCEPTED' } }),
          prisma.order.count({ where: { buyerId: userId } }),
        ]);

        stats = {
          totalBids,
          pendingBids,
          acceptedBids,
          totalOrders: orders,
        };
      }

      return stats;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user statistics');
    }
  }

  // Get user activity
  async getUserActivity(userId: string, options: { page: number; limit: number }) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const activities = await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.auditLog.count({
        where: { userId },
      });

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user activity');
    }
  }

  // Delete user account
  async deleteAccount(userId: string, password?: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify password for buyers
      if (user.role === 'BUYER' && user.passwordHash) {
        if (!password) {
          throw new ApiError(400, 'Password is required to delete account');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          throw new ApiError(401, 'Invalid password');
        }
      }

      // Check for active orders or bids
      const hasActiveData = await this.checkActiveUserData(userId, user.role);
      if (hasActiveData) {
        throw new ApiError(400, 'Cannot delete account with active orders or bids');
      }

      // Soft delete user
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          phone: null,
          email: null,
          gst: null,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete account');
    }
  }

  // Check for active user data
  private async checkActiveUserData(userId: string, role: string): Promise<boolean> {
    if (role === 'FARMER') {
      const activeProducts = await prisma.product.count({
        where: {
          farmerId: userId,
          status: { in: ['ACTIVE', 'UNDER_BID'] },
        },
      });
      return activeProducts > 0;
    } else if (role === 'BUYER') {
      const activeBids = await prisma.buyerBid.count({
        where: {
          buyerId: userId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      });
      return activeBids > 0;
    }
    return false;
  }

  // Get user notifications
  async getNotifications(userId: string, options: { page: number; limit: number; unreadOnly: boolean }) {
    try {
      const { page, limit, unreadOnly } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.notification.count({ where });
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch notifications');
    }
  }

  // Mark notification as read
  async markNotificationRead(userId: string, notificationId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new ApiError(404, 'Notification not found');
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      throw new ApiError(500, 'Failed to mark all notifications as read');
    }
  }
}

export const userService = new UserService();