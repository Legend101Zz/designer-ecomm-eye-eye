import mongoose from 'mongoose';
import { Gender, Color, Size } from '../product/product.interface';

/**
 * Interface for image data storage
 */
export interface IModel {
  url: string;
  filename: string;
}

/**
 * Interface for design placement configuration
 */
export interface IDesignPlacement {
  designId: mongoose.Types.ObjectId & {
    title?: string; // Populated from Design
    designImage?: IModel[];
    designer?: {
      // Populated from Designer
      artistName: string;
    };
  };
  position: 'front' | 'back';
  scale: number;
  rotation: number;
  coordinates: {
    x: number;
    y: number;
  };
}

/**
 * Interface for a product variant
 * Only contains essential variant-specific info
 */
export interface IProductVariant {
  baseProductId: mongoose.Types.ObjectId;
  color: Color;
  stock: Map<Size, number>;
}

/**
 * Interface for design group
 * Groups variants by gender and design combination
 */
export interface IDesignGroup {
  name: string;
  gender: Gender;
  designs: IDesignPlacement[];
  variants: IProductVariant[];
  processedImages: {
    front: IModel[];
    back: IModel[];
  };
  designPrice: number;
}

/**
 * Main interface for final products
 */
export interface IFinalProduct {
  productName: string;
  designGroups: IDesignGroup[];
  isActive: boolean;
  tags: string[];
  sales: number;
  createdAt?: Date;
  updatedAt?: Date;
}
