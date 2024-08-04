// what to do of prices
import { IModel } from '@core/interfaces/validationSchema';
import mongoose from 'mongoose';

export interface IDesignApplication {
  designId: mongoose.Types.ObjectId;
  designerId: mongoose.Types.ObjectId;
  position: 'front' | 'back';
  appliedImage: IModel;
}

export interface IFinalProductResponse {
  productId: string;
  baseProductName: string;
  mainImageUrl: string;
  otherImages: string[];
  price: number;
  category: string;
  color: string;
  sales: number;
  designs: {
    designName: string;
    designerName: string;
    position: 'front' | 'back';
    appliedImageUrl: string;
  }[];
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
