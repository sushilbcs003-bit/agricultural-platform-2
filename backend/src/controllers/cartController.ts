import { Request, Response } from 'express';
import { cartService } from '../services/cartService';
import { authenticate } from '../middleware/auth';

export class CartController {
  // Get cart
  async getCart(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;

      const cart = await cartService.getOrCreateCart(userId);

      res.json({
        success: true,
        data: cart,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to get cart' },
      });
    }
  }

  // Add to cart
  async addToCart(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;

      const item = await cartService.addToCart(userId, req.body);

      res.json({
        success: true,
        data: item,
        message: 'Item added to cart',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to add item to cart' },
      });
    }
  }

  // Update cart item
  async updateCartItem(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;
      const { itemId } = req.params;
      const { quantity } = req.body;

      const item = await cartService.updateCartItem(userId, itemId, quantity);

      res.json({
        success: true,
        data: item,
        message: 'Cart item updated',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to update cart item' },
      });
    }
  }

  // Remove from cart
  async removeFromCart(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;
      const { itemId } = req.params;

      await cartService.removeFromCart(userId, itemId);

      res.json({
        success: true,
        message: 'Item removed from cart',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to remove item from cart' },
      });
    }
  }

  // Checkout cart
  async checkoutCart(req: Request, res: Response) {
    try {
      const { id: userId, role } = req.user!;

      const order = await cartService.checkoutCart(userId, role);

      res.json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to checkout cart' },
      });
    }
  }

  // Get cart summary
  async getCartSummary(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;

      const summary = await cartService.getCartSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to get cart summary' },
      });
    }
  }
}

export const cartController = new CartController();
