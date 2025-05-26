import mongoose from 'mongoose';

export interface ITransaction {
  user: mongoose.Schema.Types.ObjectId;
  productsBought: Array<{
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
  }>;
  amount: number;
  currency: string;
  status: 'created' | 'processing' | 'failed' | 'success' | 'refunded';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
