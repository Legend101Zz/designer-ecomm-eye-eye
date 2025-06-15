import mongoose from 'mongoose';
import { Size, Color } from '../product/product.interface';

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Itransactions {
  DeliveryAddress: mongoose.Schema.Types.ObjectId;
  productsBought: [
    {
      product: mongoose.Schema.Types.ObjectId;
      quantity: number;
      size?: Size;
      color?: Color;
    },
  ];
  transaction_id: string;
  user: mongoose.Schema.Types.ObjectId;
  isCompleted: Boolean;
  paymentProvider: PaymentProvider;
  status: TransactionStatus;
  amount?: number;
  currency?: string;
  paymentDetails?: {
    paymentIntentId?: string;
    paymentMethodId?: string;
    receiptUrl?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
