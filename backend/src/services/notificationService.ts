import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';

const prisma = new PrismaClient();

export class NotificationService {
  // Send SMS using Twilio
  async sendSMS(phone: string, message: string) {
    try {
      // In development, just log the SMS
      if (process.env.NODE_ENV === 'development' || process.env.MOCK_SMS === 'true') {
        console.log(`SMS to ${phone}: ${message}`);
        return { success: true, mock: true };
      }

      // Production SMS sending with Twilio
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new ApiError(500, 'Failed to send SMS');
    }
  }

  // Send email using SendGrid
  async sendEmail(to: string, subject: string, content: string) {
    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development' || process.env.MOCK_EMAIL === 'true') {
        console.log(`Email to ${to}: ${subject}\n${content}`);
        return { success: true, mock: true };
      }

      // Production email sending with SendGrid
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html: content,
      };

      const result = await sgMail.send(msg);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new ApiError(500, 'Failed to send email');
    }
  }

  // Create in-app notification
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    metadata?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          metadata: data.metadata || {},
        },
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw new ApiError(500, 'Failed to create notification');
    }
  }

  // Send push notification (placeholder for future implementation)
  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      // Placeholder for push notification service (Firebase, OneSignal, etc.)
      console.log(`Push notification to user ${userId}: ${title} - ${body}`);
      
      // Also create in-app notification
      await this.createNotification({
        userId,
        title,
        message: body,
        type: 'INFO',
        metadata: data,
      });

      return { success: true };
    } catch (error) {
      console.error('Push notification failed:', error);
      return { success: false, error };
    }
  }

  // Send bid notification to farmer
  async notifyBidReceived(farmerId: string, buyerName: string, productName: string, bidAmount: number) {
    const title = 'New Bid Received';
    const message = `${buyerName} placed a bid of ₹${bidAmount} on your ${productName}`;

    await Promise.all([
      this.createNotification({
        userId: farmerId,
        title,
        message,
        type: 'INFO',
      }),
      this.sendPushNotification(farmerId, title, message),
    ]);
  }

  // Send bid status notification to buyer
  async notifyBidStatusUpdate(buyerId: string, productName: string, status: string) {
    const title = 'Bid Status Updated';
    const message = `Your bid on ${productName} has been ${status.toLowerCase()}`;

    await Promise.all([
      this.createNotification({
        userId: buyerId,
        title,
        message,
        type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
      }),
      this.sendPushNotification(buyerId, title, message),
    ]);
  }

  // Send order confirmation
  async notifyOrderCreated(buyerId: string, farmerId: string, productName: string, orderNumber: string) {
    const buyerTitle = 'Order Confirmed';
    const buyerMessage = `Your order ${orderNumber} for ${productName} has been confirmed`;

    const farmerTitle = 'New Order Received';
    const farmerMessage = `You received a new order ${orderNumber} for ${productName}`;

    await Promise.all([
      this.createNotification({
        userId: buyerId,
        title: buyerTitle,
        message: buyerMessage,
        type: 'SUCCESS',
      }),
      this.createNotification({
        userId: farmerId,
        title: farmerTitle,
        message: farmerMessage,
        type: 'INFO',
      }),
      this.sendPushNotification(buyerId, buyerTitle, buyerMessage),
      this.sendPushNotification(farmerId, farmerTitle, farmerMessage),
    ]);
  }

  // Send payment confirmation
  async notifyPaymentReceived(farmerId: string, buyerName: string, amount: number, orderNumber: string) {
    const title = 'Payment Received';
    const message = `₹${amount} payment received from ${buyerName} for order ${orderNumber}`;

    await Promise.all([
      this.createNotification({
        userId: farmerId,
        title,
        message,
        type: 'SUCCESS',
      }),
      this.sendPushNotification(farmerId, title, message),
    ]);
  }

  // Send quality test results
  async notifyQualityTestComplete(buyerId: string, productName: string, grade: string, score: number) {
    const title = 'Quality Test Complete';
    const message = `Quality test results for ${productName}: Grade ${grade} (${score}/100)`;

    await Promise.all([
      this.createNotification({
        userId: buyerId,
        title,
        message,
        type: 'INFO',
      }),
      this.sendPushNotification(buyerId, title, message),
    ]);
  }

  // Bulk notification for system announcements
  async sendBulkNotification(userIds: string[], title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        metadata: {},
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // Send push notifications in batches
      const pushPromises = userIds.map(userId => 
        this.sendPushNotification(userId, title, message)
      );
      await Promise.allSettled(pushPromises);

      return { success: true, sent: userIds.length };
    } catch (error) {
      console.error('Bulk notification failed:', error);
      throw new ApiError(500, 'Failed to send bulk notification');
    }
  }
}

export const notificationService = new NotificationService();