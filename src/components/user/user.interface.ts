// to be added purchases field

import mongoose from 'mongoose';
import { Size, Color } from '../product/product.interface';

export interface IUser {
  _id: string;
  username: string;
  googleId?: string;
  email: string;
  password?: string;
  isVerified: boolean; // For email verification
  following?: mongoose.Schema.Types.ObjectId[];
  isDesigner: boolean;
  addresses?: mongoose.Schema.Types.ObjectId[];
  phone?: string;
  name?: string;
  description?: string;
  DesignerId?: { type: mongoose.Schema.Types.ObjectId };
  cart: { 
    product: mongoose.Schema.Types.ObjectId; 
    quantity: number;
    size: Size;
    color: Color;
  }[];
}
