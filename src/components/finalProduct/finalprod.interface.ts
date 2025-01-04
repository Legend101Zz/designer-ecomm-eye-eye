import mongoose from 'mongoose';
import { Color, Gender, Size } from '../product/product.interface';

export interface StockMap {
  [key: string]: number; // This allows us to index with Size enum values
}

/**
 * Interface for image metadata
 */
export interface IProductImage {
  url: string;
  filename: string;
  position: 'front' | 'back';
}

/**
 * Interface for design application metadata - how a design is positioned and applied
 */
export interface IDesignApplication {
  _id?: mongoose.Types.ObjectId;
  designId: mongoose.Types.ObjectId & {
    title: string; // Virtual field when populated
  };
  designerId: mongoose.Types.ObjectId & {
    artistName: string; // Virtual field when populated
  };
  position: 'front' | 'back';
  scale?: number; // Scale factor for the design
  rotation?: number; // Rotation angle in degrees
  coordinates?: {
    // Position coordinates on the product
    x: number;
    y: number;
  };
  appliedImage: {
    // The processed image with design applied
    url: string;
    filename: string;
  };
}

/**
 * Interface for a specific product variant
 */
export interface IProductVariant {
  _id?: mongoose.Types.ObjectId;
  color: Color;
  gender: Gender;
  sizes: Size[];
  baseImages: {
    // Original product images without designs
    front: string;
    back: string;
  };
  processedImages: {
    // Images with designs applied
    front: string;
    back: string;
  };
  price: number; // Price for this specific variant
  stock: StockMap;
}

/**
 * Interface for grouping related design applications
 */
export interface IDesignGroup {
  _id: mongoose.Types.ObjectId;
  name: string; // Name for this design combination
  designs: IDesignApplication[]; // All designs in this group
  variants: IProductVariant[]; // Product variants using this design group
}

/**
 * Main interface for final products
 */
export interface IFinalProduct {
  baseProductId: mongoose.Types.ObjectId; // Reference to original product
  productName: string; // Display name for this product
  designGroups: IDesignGroup[]; // Groups of related designs
  isActive: boolean; // Whether product is available
  basePrice: number; // Base price before variants
  category: string; // Product category
  tags: string[]; // Search/filter tags
  sales: number; // Total sales count
  createdAt?: Date;
  updatedAt?: Date;
}

// Response types for API endpoints
export interface IFinalProductResponse {
  id: string;
  productName: string;
  category: string;
  designGroups: {
    name: string;
    designs: {
      designName: string;
      designerName: string;
      position: 'front' | 'back';
      previewUrl: string;
    }[];
    variants: {
      gender: string;
      colors: {
        color: string;
        price: number;
        previewUrl: string;
        sizes: string[];
      }[];
    }[];
  }[];
}
