/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { ITransaction } from './transcations.interface';

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productsBought: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Design',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'processing', 'failed', 'success', 'refunded'],
      default: 'created',
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
  },
  { timestamps: true },
);
const Transactions = mongoose.model<ITransaction>(
  'Transactions',
  TransactionSchema,
);

// eslint-disable-next-line import/prefer-default-export
export { Transactions };
