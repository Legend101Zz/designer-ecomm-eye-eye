// to be added purchases field

import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  following?: mongoose.Schema.Types.ObjectId[];
  googleId: string;
  isDesigner: boolean;
  addresses?: mongoose.Schema.Types.ObjectId[];
  phone?: string;
  name?: string;
  description?: string;
  DesignerId?: { type: mongoose.Schema.Types.ObjectId };
  cart: { product: mongoose.Schema.Types.ObjectId; quantity: number }[];
}
