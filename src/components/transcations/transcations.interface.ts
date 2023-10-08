import mongoose from 'mongoose';

export interface Itransactions {
  DeliveryAddress: mongoose.Schema.Types.ObjectId;
  productsBought: [
    { product: mongoose.Schema.Types.ObjectId; quantity: number },
  ];
  transaction_id: string;
  user: mongoose.Schema.Types.ObjectId;
  isCompleted: Boolean;
}
