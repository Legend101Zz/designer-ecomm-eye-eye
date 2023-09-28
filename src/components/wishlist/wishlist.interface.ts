import mongoose from 'mongoose';

export interface IWishlist {
  _id: string;
  userId: mongoose.Schema.Types.ObjectId;
  products: mongoose.Schema.Types.ObjectId[];
}
