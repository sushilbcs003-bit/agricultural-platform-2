import { PrismaClient } from '@prisma/client';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { productService } from '../services/productService';
import { bidService } from '../services/bidService';

const prisma = new PrismaClient();

export const resolvers = {
  // Scalar resolvers
  Date: {
    serialize: (date: Date) => date.toISOString(),
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast: any) => new Date(ast.value),
  },

  JSON: {
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: (ast: any) => JSON.parse(ast.value),
  },

  // Type resolvers
  User: {
    farmerProfile: async (parent: any) => {
      if (parent.role !== 'FARMER') return null;
      return await prisma.farmerProfile.findUnique({
        where: { userId: parent.id },
      });
    },
    buyerProfile: async (parent: any) => {
      if (parent.role !== 'BUYER') return null;
      return await prisma.buyerProfile.findUnique({
        where: { userId: parent.id },
      });
    },
    providerProfile: async (parent: any) => {
      if (parent.role !== 'PROVIDER') return null;
      return await prisma.providerProfile.findUnique({
        where: { userId: parent.id },
      });
    },
  },

  Product: {
    farmer: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.farmerId },
      });
    },
    category: async (parent: any) => {
      return await prisma.productCategory.findUnique({
        where: { id: parent.categoryId },
      });
    },
    bids: async (parent: any) => {
      return await prisma.buyerBid.findMany({
        where: { productId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    bidCount: async (parent: any) => {
      return await prisma.buyerBid.count({
        where: { productId: parent.id },
      });
    },
    testResults: async (parent: any) => {
      return await prisma.testResult.findMany({
        where: { productId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Bid: {
    product: async (parent: any) => {
      return await prisma.product.findUnique({
        where: { id: parent.productId },
      });
    },
    buyer: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.buyerId },
      });
    },
    history: async (parent: any) => {
      return await prisma.bidHistory.findMany({
        where: { bidId: parent.id },
        orderBy: { createdAt: 'asc' },
        include: { user: true },
      });
    },
  },

  // Query resolvers
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      return await userService.getUserById(context.user.id);
    },

    userStats: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      return await userService.getUserStats(context.user.id, context.user.role);
    },

    products: async (_: any, { filters, pagination, sort }: any) => {
      const { page = 1, limit = 20 } = pagination || {};
      const { field = 'createdAt', order = 'desc' } = sort || {};
      
      return await productService.getProducts({
        ...filters,
        page,
        limit,
        sortBy: field,
        sortOrder: order,
      });
    },

    product: async (_: any, { id }: any) => {
      return await productService.getProductById(id);
    },

    productCategories: async () => {
      return await productService.getCategories();
    },

    farmerProducts: async (_: any, { pagination }: any, context: any) => {
      if (!context.user || context.user.role !== 'FARMER') {
        throw new ForbiddenError('Farmer access required');
      }
      
      const { page = 1, limit = 20 } = pagination || {};
      return await productService.getFarmerProducts(context.user.id, { page, limit });
    },

    productBids: async (_: any, { productId, pagination }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const { page = 1, limit = 20 } = pagination || {};
      return await bidService.getProductBids(productId, context.user.id, { page, limit });
    },

    buyerBids: async (_: any, { pagination }: any, context: any) => {
      if (!context.user || context.user.role !== 'BUYER') {
        throw new ForbiddenError('Buyer access required');
      }
      
      const { page = 1, limit = 20 } = pagination || {};
      return await bidService.getBuyerBids(context.user.id, { page, limit });
    },

    bid: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      return await bidService.getBidById(id, context.user.id);
    },

    notifications: async (_: any, { pagination, unreadOnly }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const { page = 1, limit = 20 } = pagination || {};
      return await userService.getNotifications(context.user.id, {
        page,
        limit,
        unreadOnly: unreadOnly || false,
      });
    },
  },

  // Mutation resolvers
  Mutation: {
    requestOTP: async (_: any, { phone }: any) => {
      await authService.requestOTP(phone);
      return true;
    },

    verifyOTP: async (_: any, { phone, otp }: any) => {
      return await authService.verifyOTP(phone, otp);
    },

    registerFarmer: async (_: any, { input }: any) => {
      return await authService.registerFarmer(input);
    },

    registerBuyer: async (_: any, { input }: any) => {
      const result = await authService.registerBuyer(input);
      return result.user;
    },

    login: async (_: any, { gst, password }: any) => {
      return await authService.loginBuyer(gst, password);
    },

    refreshToken: async (_: any, { refreshToken }: any) => {
      return await authService.refreshAccessToken(refreshToken);
    },

    logout: async (_: any, __: any, context: any) => {
      if (context.sessionId) {
        await authService.logout(context.sessionId);
      }
      return true;
    },

    createProduct: async (_: any, { input }: any, context: any) => {
      if (!context.user || context.user.role !== 'FARMER') {
        throw new ForbiddenError('Farmer access required');
      }
      
      const productData = { ...input, farmerId: context.user.id };
      return await productService.createProduct(productData);
    },

    updateProduct: async (_: any, { id, input }: any, context: any) => {
      if (!context.user || context.user.role !== 'FARMER') {
        throw new ForbiddenError('Farmer access required');
      }
      
      return await productService.updateProduct(id, context.user.id, input);
    },

    deleteProduct: async (_: any, { id }: any, context: any) => {
      if (!context.user || context.user.role !== 'FARMER') {
        throw new ForbiddenError('Farmer access required');
      }
      
      await productService.deleteProduct(id, context.user.id);
      return true;
    },

    createBid: async (_: any, { input }: any, context: any) => {
      if (!context.user || context.user.role !== 'BUYER') {
        throw new ForbiddenError('Buyer access required');
      }
      
      const bidData = { ...input, buyerId: context.user.id };
      return await bidService.createBid(bidData);
    },

    updateBidStatus: async (_: any, { bidId, status, counterPrice, message }: any, context: any) => {
      if (!context.user || context.user.role !== 'FARMER') {
        throw new ForbiddenError('Farmer access required');
      }
      
      return await bidService.updateBidStatus(bidId, context.user.id, {
        status,
        counterPrice,
        message,
      });
    },

    counterBid: async (_: any, { bidId, counterPrice, message }: any, context: any) => {
      if (!context.user || context.user.role !== 'BUYER') {
        throw new ForbiddenError('Buyer access required');
      }
      
      return await bidService.counterBid(bidId, context.user.id, {
        counterPrice,
        message,
      });
    },

    markNotificationRead: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      await userService.markNotificationRead(context.user.id, id);
      return true;
    },

    markAllNotificationsRead: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      await userService.markAllNotificationsRead(context.user.id);
      return true;
    },
  },

  // Subscription resolvers (placeholder)
  Subscription: {
    bidUpdated: {
      // Implementation would use pubsub for real-time updates
      subscribe: () => {
        // Return async iterator for real-time updates
      },
    },
    
    newNotification: {
      // Implementation would use pubsub for real-time notifications
      subscribe: () => {
        // Return async iterator for real-time notifications
      },
    },
  },
};