import { Router } from 'express';
import { cartController } from '../controllers/cartController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Cart operations
router.get('/', cartController.getCart.bind(cartController));
router.post('/items', cartController.addToCart.bind(cartController));
router.put('/items/:itemId', cartController.updateCartItem.bind(cartController));
router.delete('/items/:itemId', cartController.removeFromCart.bind(cartController));
router.post('/checkout', cartController.checkoutCart.bind(cartController));
router.get('/summary', cartController.getCartSummary.bind(cartController));

export default router;
