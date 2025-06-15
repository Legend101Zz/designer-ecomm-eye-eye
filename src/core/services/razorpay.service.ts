/* eslint-disable @typescript-eslint/no-explicit-any */
import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '@core/utils/logger';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface RazorpayOrderData {
  amount: number; // Amount in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, any>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  /**
   * Create a new Razorpay order
   */
  static async createOrder(
    orderData: RazorpayOrderData,
  ): Promise<RazorpayOrder> {
    try {
      logger.info('Creating Razorpay order:', orderData);

      const order = await razorpay.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {},
      });

      logger.info('Razorpay order created successfully:', order.id);
      return order as RazorpayOrder;
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create Razorpay order');
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(data: PaymentVerificationData): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        data;

      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === razorpay_signature;

      logger.info('Payment signature verification:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Get payment details by payment ID
   */
  static async getPayment(paymentId: string): Promise<any> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Error fetching payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Get order details by order ID
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      logger.error('Error fetching order details:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

export default RazorpayService;
