import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { notificationService } from './notificationService';
import { productService } from './productService';

const prisma = new PrismaClient();

export class BidService {
  // Create new bid (Buyer only)
  async createBid(data: any) {
    try {
      const { productId, buyerId, offeredPrice, quantity, message } = data;

      // Verify buyer exists
      const buyer = await prisma.user.findUnique({
        where: { id: buyerId },
        include: { buyerProfile: true },
      });

      if (!buyer || buyer.role !== 'BUYER') {
        throw new ApiError(403, 'Only buyers can place bids');
      }

      if (!buyer.emailVerified) {
        throw new ApiError(403, 'Please verify your email before placing bids');
      }

      // Verify product exists and is available for bidding
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      if (product.status !== 'ACTIVE') {
        throw new ApiError(400, 'Product is not available for bidding');
      }

      if (product.farmerId === buyerId) {
        throw new ApiError(400, 'Cannot bid on your own product');
      }

      if (quantity > product.quantity) {
        throw new ApiError(400, 'Bid quantity exceeds available quantity');
      }

      // Check if buyer already has a pending bid on this product
      const existingBid = await prisma.buyerBid.findFirst({
        where: {
          productId,
          buyerId,
          status: { in: ['PENDING', 'COUNTERED'] },
        },
      });

      if (existingBid) {
        throw new ApiError(400, 'You already have an active bid on this product');
      }

      // Create bid
      const bid = await prisma.$transaction(async (tx) => {
        const newBid = await tx.buyerBid.create({
          data: {
            productId,
            buyerId,
            offeredPrice,
            quantity,
            message,
            status: 'PENDING',
            negotiationRound: 1,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                buyerProfile: {
                  select: {
                    businessName: true,
                    rating: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                nameEn: true,
                nameHi: true,
                farmerId: true,
                expectedPrice: true,
              },
            },
          },
        });

        // Create bid history entry
        await tx.bidHistory.create({
          data: {
            bidId: newBid.id,
            action: 'BID_PLACED',
            price: offeredPrice,
            message,
            userId: buyerId,
          },
        });

        // Update product status to UNDER_BID if this is the first bid
        const bidCount = await tx.buyerBid.count({
          where: { productId, status: { not: 'CANCELLED' } },
        });

        if (bidCount === 1) {
          await tx.product.update({
            where: { id: productId },
            data: { status: 'UNDER_BID' },
          });
        }

        return newBid;
      });

      // Send notification to farmer
      await notificationService.notifyBidReceived(
        product.farmerId,
        buyer.buyerProfile?.businessName || buyer.name,
        product.nameEn,
        offeredPrice
      );

      // Log activity
      await this.logActivity(buyerId, 'BID_PLACED', {
        bidId: bid.id,
        productId,
        offeredPrice,
        quantity,
      });

      return bid;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create bid');
    }
  }

  // Get bids for a product (Farmer only, own products)
  async getProductBids(productId: string, farmerId: string, filters: any) {
    try {
      // Verify product belongs to farmer
      const product = await prisma.product.findFirst({
        where: { id: productId, farmerId },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found or access denied');
      }

      const { page = 1, limit = 20, status } = filters;
      const skip = (page - 1) * limit;
      
      const where: any = { productId };
      if (status) {
        where.status = status;
      }

      const [bids, total] = await Promise.all([
        prisma.buyerBid.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                buyerProfile: {
                  select: {
                    businessName: true,
                    businessType: true,
                    rating: true,
                    totalRatings: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                nameEn: true,
                nameHi: true,
                expectedPrice: true,
              },
            },
          },
        }),
        prisma.buyerBid.count({ where }),
      ]);

      return {
        bids,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch product bids');
    }
  }

  // Get buyer's bids
  async getBuyerBids(buyerId: string, filters: any) {
    try {
      const { page = 1, limit = 20, status } = filters;
      const skip = (page - 1) * limit;
      
      const where: any = { buyerId };
      if (status) {
        where.status = status;
      }

      const [bids, total] = await Promise.all([
        prisma.buyerBid.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                nameEn: true,
                nameHi: true,
                images: true,
                expectedPrice: true,
                status: true,
                farmer: {
                  select: {
                    id: true,
                    name: true,
                    farmerProfile: {
                      select: {
                        district: true,
                        state: true,
                        rating: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.buyerBid.count({ where }),
      ]);

      return {
        bids,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch buyer bids');
    }
  }

  // Update bid status (Farmer only)
  async updateBidStatus(bidId: string, farmerId: string, updateData: any) {
    try {
      const { status, counterPrice, message } = updateData;

      // Verify bid exists and belongs to farmer's product
      const bid = await prisma.buyerBid.findFirst({
        where: {
          id: bidId,
          product: { farmerId },
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              buyerProfile: {
                select: {
                  businessName: true,
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              nameEn: true,
              farmerId: true,
              expectedPrice: true,
            },
          },
        },
      });

      if (!bid) {
        throw new ApiError(404, 'Bid not found or access denied');
      }

      if (bid.status !== 'PENDING' && bid.status !== 'COUNTERED') {
        throw new ApiError(400, 'Can only update pending or countered bids');
      }

      // Validate status transition
      if (!['ACCEPTED', 'REJECTED', 'COUNTERED'].includes(status)) {
        throw new ApiError(400, 'Invalid bid status');
      }

      if (status === 'COUNTERED' && !counterPrice) {
        throw new ApiError(400, 'Counter price is required for counter bids');
      }

      if (status === 'COUNTERED' && bid.negotiationRound >= 2) {
        throw new ApiError(400, 'Maximum 2 rounds of negotiation allowed');
      }

      // Update bid
      const updatedBid = await prisma.$transaction(async (tx) => {
        const updatePayload: any = {
          status,
          ...(message && { counterMessage: message }),
        };

        if (status === 'COUNTERED') {
          updatePayload.counterPrice = counterPrice;
          updatePayload.negotiationRound = bid.negotiationRound + 1;
        }

        const updated = await tx.buyerBid.update({
          where: { id: bidId },
          data: updatePayload,
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                buyerProfile: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                nameEn: true,
                nameHi: true,
              },
            },
          },
        });

        // Create bid history entry
        await tx.bidHistory.create({
          data: {
            bidId,
            action: `BID_${status}`,
            price: status === 'COUNTERED' ? counterPrice : bid.offeredPrice,
            message,
            userId: farmerId,
          },
        });

        // If accepted, reject all other pending bids for this product
        if (status === 'ACCEPTED') {
          await tx.buyerBid.updateMany({
            where: {
              productId: bid.productId,
              id: { not: bidId },
              status: { in: ['PENDING', 'COUNTERED'] },
            },
            data: { status: 'REJECTED' },
          });

          // Update product status to SOLD
          await tx.product.update({
            where: { id: bid.productId },
            data: {
              status: 'SOLD',
              finalPrice: bid.offeredPrice,
            },
          });

          // Create order
          await this.createOrderFromBid(tx, updated);
        }

        return updated;
      });

      // Send notification to buyer
      await notificationService.notifyBidStatusUpdate(
        bid.buyerId,
        bid.product.nameEn,
        status
      );

      // Log activity
      await this.logActivity(farmerId, `BID_${status}`, {
        bidId,
        productId: bid.productId,
        buyerId: bid.buyerId,
        price: status === 'COUNTERED' ? counterPrice : bid.offeredPrice,
      });

      return updatedBid;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update bid status');
    }
  }

  // Counter bid (Buyer only)
  async counterBid(bidId: string, buyerId: string, counterData: any) {
    try {
      const { counterPrice, message } = counterData;

      // Verify bid exists and belongs to buyer
      const bid = await prisma.buyerBid.findFirst({
        where: { id: bidId, buyerId },
        include: {
          product: {
            select: {
              id: true,
              nameEn: true,
              farmerId: true,
              status: true,
            },
          },
        },
      });

      if (!bid) {
        throw new ApiError(404, 'Bid not found or access denied');
      }

      if (bid.status !== 'COUNTERED') {
        throw new ApiError(400, 'Can only counter a countered bid');
      }

      if (bid.negotiationRound >= 2) {
        throw new ApiError(400, 'Maximum negotiation rounds reached');
      }

      if (bid.product.status !== 'UNDER_BID') {
        throw new ApiError(400, 'Product is no longer available for bidding');
      }

      // Update bid with buyer's counter
      const updatedBid = await prisma.$transaction(async (tx) => {
        const updated = await tx.buyerBid.update({
          where: { id: bidId },
          data: {
            offeredPrice: counterPrice,
            message,
            status: 'PENDING',
            negotiationRound: bid.negotiationRound + 1,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset expiry
          },
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                buyerProfile: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
            product: {
              select: {
                id: true,
                nameEn: true,
                nameHi: true,
              },
            },
          },
        });

        // Create bid history entry
        await tx.bidHistory.create({
          data: {
            bidId,
            action: 'BID_COUNTERED_BY_BUYER',
            price: counterPrice,
            message,
            userId: buyerId,
          },
        });

        return updated;
      });

      // Notify farmer of counter bid
      await notificationService.notifyBidReceived(
        bid.product.farmerId,
        bid.buyer?.buyerProfile?.businessName || 'Buyer',
        bid.product.nameEn,
        counterPrice
      );

      // Log activity
      await this.logActivity(buyerId, 'BID_COUNTER_OFFER', {
        bidId,
        productId: bid.productId,
        newPrice: counterPrice,
        round: bid.negotiationRound + 1,
      });

      return updatedBid;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to counter bid');
    }
  }

  // Accept counter bid (Farmer only)
  async acceptCounterBid(bidId: string, farmerId: string) {
    try {
      return await this.updateBidStatus(bidId, farmerId, { status: 'ACCEPTED' });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to accept counter bid');
    }
  }

  // Reject counter bid (Farmer only)
  async rejectCounterBid(bidId: string, farmerId: string, message?: string) {
    try {
      return await this.updateBidStatus(bidId, farmerId, { status: 'REJECTED', message });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to reject counter bid');
    }
  }

  // Get bid by ID
  async getBidById(bidId: string, userId: string) {
    try {
      const bid = await prisma.buyerBid.findUnique({
        where: { id: bidId },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              buyerProfile: {
                select: {
                  businessName: true,
                  businessType: true,
                  rating: true,
                  totalRatings: true,
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              nameEn: true,
              nameHi: true,
              images: true,
              expectedPrice: true,
              status: true,
              farmerId: true,
              farmer: {
                select: {
                  id: true,
                  name: true,
                  farmerProfile: {
                    select: {
                      district: true,
                      state: true,
                      rating: true,
                    },
                  },
                },
              },
            },
          },
          history: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!bid) {
        throw new ApiError(404, 'Bid not found');
      }

      // Check if user has access to this bid
      const hasAccess = bid.buyerId === userId || bid.product.farmerId === userId;
      if (!hasAccess) {
        throw new ApiError(403, 'Access denied');
      }

      return bid;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch bid');
    }
  }

  // Delete bid (Buyer only, own bids, only if PENDING)
  async deleteBid(bidId: string, buyerId: string) {
    try {
      const bid = await prisma.buyerBid.findFirst({
        where: { id: bidId, buyerId },
      });

      if (!bid) {
        throw new ApiError(404, 'Bid not found or access denied');
      }

      if (bid.status !== 'PENDING') {
        throw new ApiError(400, 'Can only delete pending bids');
      }

      await prisma.$transaction(async (tx) => {
        // Update bid status to cancelled
        await tx.buyerBid.update({
          where: { id: bidId },
          data: { status: 'CANCELLED' },
        });

        // Create bid history entry
        await tx.bidHistory.create({
          data: {
            bidId,
            action: 'BID_CANCELLED',
            userId: buyerId,
          },
        });

        // Check if this was the last active bid for the product
        const activeBids = await tx.buyerBid.count({
          where: {
            productId: bid.productId,
            status: { in: ['PENDING', 'COUNTERED'] },
          },
        });

        if (activeBids === 0) {
          // Update product status back to ACTIVE
          await tx.product.update({
            where: { id: bid.productId },
            data: { status: 'ACTIVE' },
          });
        }
      });

      // Log activity
      await this.logActivity(buyerId, 'BID_CANCELLED', {
        bidId,
        productId: bid.productId,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete bid');
    }
  }

  // Get bid history
  async getBidHistory(bidId: string, userId: string) {
    try {
      // First verify user has access to this bid
      const bid = await prisma.buyerBid.findUnique({
        where: { id: bidId },
        include: {
          product: {
            select: {
              farmerId: true,
            },
          },
        },
      });

      if (!bid) {
        throw new ApiError(404, 'Bid not found');
      }

      const hasAccess = bid.buyerId === userId || bid.product.farmerId === userId;
      if (!hasAccess) {
        throw new ApiError(403, 'Access denied');
      }

      const history = await prisma.bidHistory.findMany({
        where: { bidId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

      return history;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch bid history');
    }
  }

  // Get bid statistics
  async getBidStats(userId: string, role: string) {
    try {
      let stats: any = {};

      if (role === 'FARMER') {
        const productBids = await prisma.buyerBid.groupBy({
          by: ['status'],
          where: {
            product: { farmerId: userId },
          },
          _count: {
            status: true,
          },
        });

        stats = {
          totalBids: 0,
          pendingBids: 0,
          acceptedBids: 0,
          rejectedBids: 0,
        };

        productBids.forEach(group => {
          stats.totalBids += group._count.status;
          switch (group.status) {
            case 'PENDING':
            case 'COUNTERED':
              stats.pendingBids += group._count.status;
              break;
            case 'ACCEPTED':
              stats.acceptedBids += group._count.status;
              break;
            case 'REJECTED':
              stats.rejectedBids += group._count.status;
              break;
          }
        });
      } else if (role === 'BUYER') {
        const buyerBids = await prisma.buyerBid.groupBy({
          by: ['status'],
          where: { buyerId: userId },
          _count: {
            status: true,
          },
        });

        stats = {
          totalBids: 0,
          pendingBids: 0,
          acceptedBids: 0,
          rejectedBids: 0,
        };

        buyerBids.forEach(group => {
          stats.totalBids += group._count.status;
          switch (group.status) {
            case 'PENDING':
            case 'COUNTERED':
              stats.pendingBids += group._count.status;
              break;
            case 'ACCEPTED':
              stats.acceptedBids += group._count.status;
              break;
            case 'REJECTED':
              stats.rejectedBids += group._count.status;
              break;
          }
        });
      }

      return stats;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch bid statistics');
    }
  }

  // Expire old bids (to be called by cron job)
  async expireOldBids() {
    try {
      const expiredBids = await prisma.buyerBid.updateMany({
        where: {
          status: { in: ['PENDING', 'COUNTERED'] },
          expiresAt: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });

      console.log(`Expired ${expiredBids.count} old bids`);
      return expiredBids.count;
    } catch (error) {
      console.error('Failed to expire old bids:', error);
      throw new ApiError(500, 'Failed to expire old bids');
    }
  }

  // Private helper methods
  private async createOrderFromBid(tx: any, bid: any) {
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          productId: bid.productId,
          buyerId: bid.buyerId,
          farmerId: bid.product.farmerId,
          quantity: bid.quantity,
          price: bid.offeredPrice,
          totalAmount: bid.offeredPrice * bid.quantity,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          deliveryAddress: '', // This would be provided later
        },
      });

      // Notify both parties about order creation
      await notificationService.notifyOrderCreated(
        bid.buyerId,
        bid.product.farmerId,
        bid.product.nameEn,
        orderNumber
      );

      return order;
    } catch (error) {
      console.error('Failed to create order from bid:', error);
      throw error;
    }
  }

  private async logActivity(userId: string, action: string, metadata: any) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          metadata,
          ipAddress: '', // This would come from request context
          userAgent: '', // This would come from request context
        },
      });
    } catch (error) {
      // Log activity failure shouldn't break the main operation
      console.error('Failed to log activity:', error);
    }
  }
}

export const bidService = new BidService();