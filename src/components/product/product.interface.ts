import { Document } from 'mongoose';

export enum ProductType {
  CLOTHING = 'clothing',
  ACCESSORY = 'accessory',
  CASE = 'case',
  HOMEWARE = 'homeware',
}

export enum ClothingCategory {
  SHIRT = 'shirt',
  TSHIRT = 'Tshirt',
  HOODIE = 'hoodie',
}

export enum AccessoryCategory {
  PHONE_CASE = 'phoneCase',
  LAPTOP_CASE = 'laptopCase',
  MUG = 'mug',
  STICKER = 'sticker',
}

export enum Color {
  RED = 'red',
  BLACK = 'black',
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
}

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNISEX = 'unisex',
}

export interface DeviceVariant {
  deviceBrand: string;
  deviceModel: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface IProductImage {
  url: string;
  filename: string;
  position: 'front' | 'back' | 'side' | 'detail';
  color: Color;
  variant?: string;
}

export interface IProductBase {
  name: string;
  quantity: number;
  basePrice: number;
  productType: ProductType;
  colors: Color[];
  description?: string;
  isActive: boolean;
  images: IProductImage[];
}

export interface IClothingProduct extends IProductBase {
  productType: ProductType.CLOTHING;
  category: ClothingCategory;
  sizes: Size[];
  gender: Gender[];
  measurements?: {
    [key in Size]: {
      chest: number;
      length: number;
      sleeve?: number;
    };
  };
}

export interface IAccessoryProduct extends IProductBase {
  productType: ProductType.ACCESSORY;
  category: AccessoryCategory;
  deviceVariants?: DeviceVariant[];
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
}

export interface ProductDocument extends Document {
  name: string;
  quantity: number;
  basePrice: number;
  productType: ProductType;
  colors: Color[];
  description?: string;
  isActive: boolean;
  images: IProductImage[];
  category: ClothingCategory | AccessoryCategory;
  gender?: Gender[];
  sizes?: Size[];
  deviceVariants?: DeviceVariant[];
  measurements?: {
    [key in Size]: {
      chest: number;
      length: number;
      sleeve?: number;
    };
  };
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
  calculateRequiredImages(): number;
}

export type Iproduct = IClothingProduct | IAccessoryProduct;
