import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';

const prisma = new PrismaClient();

export class CartService {
  // Get or create active cart for user
  async getOrCreateCart(userId: string) {
    try {
      let cart = await prisma.cart.findFirst({
        where: {
          ownerUserId: userId,
          status: 'ACTIVE',
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  farmer: {
                    include: {
                      farmerProfile: true,
                    },
                  },
                },
              },
              machineryInventory: {
                include: {
                  supplier: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          phone: true,
                          email: true,
                        },
                      },
                    },
                  },
                  machineryType: {
                    include: { category: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            ownerUserId: userId,
            status: 'ACTIVE',
          },
          include: {
            items: {
              include: {
                product: true,
                machineryInventory: true,
              },
            },
          },
        });
      }

      return cart;
    } catch (error) {
      throw new ApiError(500, 'Failed to get cart');
    }
  }

  // Add item to cart
  async addToCart(
    userId: string,
    data: {
      itemType: 'PRODUCT' | 'SERVICE';
      productId?: string;
      machineryInventoryId?: string;
      quantity: number;
      unitPrice?: number;
      metaJson?: any;
    }
  ) {
    try {
      // Get or create cart
      const cart = await this.getOrCreateCart(userId);

      // Validate item type and references
      if (data.itemType === 'PRODUCT') {
        if (!data.productId) {
          throw new ApiError(400, 'Product ID required for product items');
        }

        // Verify product exists and is available
        const product = await prisma.product.findUnique({
          where: { id: data.productId },
        });

        if (!product) {
          throw new ApiError(404, 'Product not found');
        }

        if (!product.isAvailable || product.status !== 'PUBLISHED') {
          throw new ApiError(400, 'Product is not available');
        }

        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            itemType: 'PRODUCT',
            productId: data.productId,
          },
        });

        if (existingItem) {
          // Update quantity
          return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + data.quantity,
            },
            include: {
              product: true,
            },
          });
        }
      } else if (data.itemType === 'SERVICE') {
        if (!data.machineryInventoryId) {
          throw new ApiError(400, 'Machinery inventory ID required for service items');
        }

        // Verify machinery exists and is available
        const machinery = await prisma.supplierMachineryInventory.findUnique({
          where: { id: data.machineryInventoryId },
        });

        if (!machinery) {
          throw new ApiError(404, 'Machinery not found');
        }

        if (machinery.availabilityStatus !== 'AVAILABLE') {
          throw new ApiError(400, 'Machinery is not available');
        }
      }

      // Create cart item
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          itemType: data.itemType,
          productId: data.productId,
          machineryInventoryId: data.machineryInventoryId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          metaJson: data.metaJson,
        },
        include: {
          product: true,
          machineryInventory: true,
        },
      });

      return cartItem;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to add item to cart');
    }
  }

  // Update cart item quantity
  async updateCartItem(userId: string, itemId: string, quantity: number) {
    try {
      // Verify cart ownership
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!cartItem) {
        throw new ApiError(404, 'Cart item not found');
      }

      if (cartItem.cart.ownerUserId !== userId) {
        throw new ApiError(403, 'You can only modify your own cart');
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return await this.removeFromCart(userId, itemId);
      }

      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: {
          product: true,
          machineryInventory: true,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update cart item');
    }
  }

  // Remove item from cart
  async removeFromCart(userId: string, itemId: string) {
    try {
      // Verify cart ownership
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!cartItem) {
        throw new ApiError(404, 'Cart item not found');
      }

      if (cartItem.cart.ownerUserId !== userId) {
        throw new ApiError(403, 'You can only modify your own cart');
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to remove item from cart');
    }
  }

  // Checkout cart (create order)
  async checkoutCart(userId: string, userRole: string) {
    try {
      const cart = await this.getOrCreateCart(userId);

      if (cart.items.length === 0) {
        throw new ApiError(400, 'Cart is empty');
      }

      // Group items by type
      const productItems = cart.items.filter(item => item.itemType === 'PRODUCT');
      const serviceItems = cart.items.filter(item => item.itemType === 'SERVICE');

      // Determine order type
      let orderType: 'PRODUCE' | 'SERVICE' | 'MIXED' = 'PRODUCE';
      if (productItems.length > 0 && serviceItems.length > 0) {
        orderType = 'MIXED';
      } else if (serviceItems.length > 0) {
        orderType = 'SERVICE';
      }

      // Create order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerUserId: userRole === 'BUYER' ? userId : null,
          farmerUserId: userRole === 'FARMER' ? userId : null,
          orderType,
          status: 'CREATED',
          paymentStatus: 'UNPAID',
        },
      });

      // Create order items for products
      if (productItems.length > 0) {
        for (const item of productItems) {
          if (!item.productId) continue;

          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) continue;

          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              farmerUserId: product.farmerUserId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || product.price,
              lineTotal: (item.unitPrice || product.price) * item.quantity,
              status: 'CREATED',
            },
          });
        }
      }

      // Create service order items
      if (serviceItems.length > 0) {
        for (const item of serviceItems) {
          if (!item.machineryInventoryId) continue;

          const machinery = await prisma.supplierMachineryInventory.findUnique({
            where: { id: item.machineryInventoryId },
          });

          if (!machinery) continue;

          await prisma.serviceOrderItem.create({
            data: {
              orderId: order.id,
              machineryInventoryId: item.machineryInventoryId,
              supplierUserId: machinery.supplierUserId,
              requesterUserId: userId,
              quantity: item.quantity,
              serviceStatus: 'CREATED',
            },
          });
        }
      }

      // Mark cart as checked out
      await prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'CHECKED_OUT' },
      });

      return order;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to checkout cart');
    }
  }

  // Get cart summary
  async getCartSummary(userId: string) {
    try {
      const cart = await this.getOrCreateCart(userId);

      let totalAmount = 0;
      let itemCount = 0;

      for (const item of cart.items) {
        if (item.itemType === 'PRODUCT' && item.unitPrice) {
          totalAmount += Number(item.unitPrice) * Number(item.quantity);
        }
        itemCount += Number(item.quantity);
      }

      return {
        itemCount,
        totalAmount,
        items: cart.items.length,
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to get cart summary');
    }
  }
}

export const cartService = new CartService();
