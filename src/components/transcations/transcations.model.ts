/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import {
  Itransactions,
  PaymentProvider,
  TransactionStatus,
} from './transcations.interface';
import { Size, Color } from '../product/product.interface';

const TransactionSchema: Schema<Itransactions> = new Schema(
  {
    DeliveryAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
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
          min: 1,
        },
        size: {
          type: String,
          enum: Object.values(Size),
          required: false,
        },
        color: {
          type: String,
          enum: Object.values(Color),
          required: false,
        },
      },
    ],
    transaction_id: { type: String, required: true, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    paymentProvider: {
      type: String,
      enum: Object.values(PaymentProvider),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentDetails: {
      paymentIntentId: String,
      paymentMethodId: String,
      receiptUrl: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Add indexes for better query performance
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ transaction_id: 1 });
TransactionSchema.index({ status: 1 });

const transcations = mongoose.model<Itransactions>(
  'Transactions',
  TransactionSchema,
);

// eslint-disable-next-line import/prefer-default-export
export { transcations };
