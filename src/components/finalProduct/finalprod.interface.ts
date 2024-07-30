// what to do of prices
import { IModel } from '@core/interfaces/validationSchema';
import mongoose from 'mongoose';

export interface IDesignApplication {
  designId: mongoose.Types.ObjectId;
  designerId: mongoose.Types.ObjectId;
  position: 'front' | 'back';
  appliedImage: IModel;
}

export interface IfinalProduct {
  price: number;
  sales: number;
  color: string;
  category: string;
  baseProductImages: IModel[];
  appliedDesigns: IDesignApplication[];
  productId: mongoose.Types.ObjectId;
}

export enum Category {
  shirt = 'shirt',
  Tshirt = 'Tshirt',
  Cup = 'cup',
}

export enum Color {
  red = 'red',
  black = 'black',
  white = 'white',
  yellow = 'yellow',
  blue = 'blue',
}
