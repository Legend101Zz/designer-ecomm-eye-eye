// to be added purchases field

import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  username: String;
  email: String;
  password?: String;
  following?: mongoose.Schema.Types.ObjectId[];
  googleId: String;
  isDesigner: Boolean;
  addresses?: mongoose.Schema.Types.ObjectId[];
  phone?: String;
  name?: String;
  description?: String;
  DesignerId?: { type: mongoose.Schema.Types.ObjectId };
  cart: { product: mongoose.Schema.Types.ObjectId; quantity: number }[];
}
