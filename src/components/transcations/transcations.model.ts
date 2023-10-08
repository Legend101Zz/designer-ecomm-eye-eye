/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { Itransactions } from './transcations.interface';

const TransactionSchema: Schema<Itransactions> = new Schema({
  DeliveryAddress: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  productsBought: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Design',
      },
      quantity: Number,
    },
  ],
  transaction_id: { type: String, required: true },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

const transcations = mongoose.model<Itransactions>(
  'Transactions',
  TransactionSchema,
);

// eslint-disable-next-line import/prefer-default-export
export { transcations };
