/**
 * Payment Service - Reusable payment utilities for all user roles
 * Used by Buyer, Farmer, and Supplier dashboards
 * Can be extended for real payment gateway integration (Razorpay, Stripe, etc.)
 */

import api from './api';

/**
 * Record payment (reference-only - no sensitive data stored)
 * Calls backend which stores hashed reference only.
 * @param {Object} params
 * @param {string} [params.bidId] - Bid ID (for bid context)
 * @param {string} [params.orderId] - Order ID (for order context)
 * @param {number} params.amount - Amount in rupees
 * @param {string} params.payerUserId - Payer user ID
 * @param {string} params.payerRole - BUYER | FARMER | SUPPLIER
 */
export const recordPayment = async (params) => {
  const { data } = await api.post('/api/payments/record', {
    bidId: params.bidId || null,
    orderId: params.orderId || null,
    amount: params.amount,
    currency: params.currency || 'INR',
    payerUserId: params.payerUserId,
    payerRole: params.payerRole,
    clientRef: params.clientRef || (params.bidId ? `bid_${params.bidId}_paid` : `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  });
  return data;
};

/** @deprecated Use recordPayment */
export const simulatePayment = async (params) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, paymentId: `sim_${Date.now()}`, status: 'PAID' };
};

/**
 * Create payment intent (placeholder for Razorpay/Stripe integration)
 */
export const createPaymentIntent = async ({ amount, currency = 'INR', orderId, metadata = {} }) => {
  // Future: POST /api/payments/create-intent
  throw new Error('Payment gateway not configured');
};

/**
 * Verify payment (placeholder)
 */
export const verifyPayment = async (paymentId) => {
  // Future: POST /api/payments/verify
  throw new Error('Payment verification not configured');
};

/**
 * Build payment line items from bid
 */
export const bidToPaymentItems = (bid) => {
  const bidPrice = bid.bidPrice ?? bid.offeredPrice ?? 0;
  const qty = bid.quantity ?? 0;
  const desc = bid.productName ?? bid.product?.name ?? 'Product';
  const unit = (bid.product?.unit ?? 'unit').toLowerCase?.() || 'unit';
  return [{
    description: desc,
    quantity: qty,
    unit: unit,
    unitPrice: bidPrice,
    lineTotal: bidPrice * qty
  }];
};

/**
 * Build payment line items from order
 */
export const orderToPaymentItems = (order) => {
  return (order.items || order.orderItems || []).map(item => ({
    description: item.productName ?? item.product?.name ?? 'Item',
    quantity: item.quantity ?? 0,
    unit: item.unit ?? 'unit',
    unitPrice: item.unitPrice ?? item.price ?? 0,
    lineTotal: item.lineTotal ?? (item.quantity * (item.unitPrice ?? item.price ?? 0))
  }));
};

/**
 * Build payment line items from service booking
 */
export const serviceToPaymentItems = (booking) => {
  return [{
    description: booking.serviceName ?? 'Service',
    quantity: booking.quantity ?? 1,
    unit: 'booking',
    unitPrice: booking.price ?? 0,
    lineTotal: (booking.quantity ?? 1) * (booking.price ?? 0)
  }];
};

export default {
  recordPayment,
  simulatePayment,
  createPaymentIntent,
  verifyPayment,
  bidToPaymentItems,
  orderToPaymentItems,
  serviceToPaymentItems
};
