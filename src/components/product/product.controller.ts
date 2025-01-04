import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import AppError from '@core/utils/appError';
import { product } from '@components/product/product.model';
import {
  ProductType,
  IProductImage,
  Color,
  ProductDocument,
} from './product.interface';
import { createProduct, readProduct, updateProduct } from './product.service';

interface CustomRequest extends Request {
  files: any[];
  uploadedImages?: Array<{ url: string; public_id: string }>;
}

/**
 * Creates a new product with proper categorization and image handling
 * @param {CustomRequest} req - Express request object with files
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const createProd = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      quantity,
      productType,
      category,
      colors,
      sizes,
      basePrice,
      gender,
      description,
      deviceVariants,
      dimensions,
      measurements,
    } = req.body;

    // Process images with proper metadata
    const processedImages: IProductImage[] = req.files.map((file, index) => {
      return {
        url: file.path,
        filename: file.filename,
        // eslint-disable-next-line no-nested-ternary
        position: index === 0 ? 'front' : index === 1 ? 'back' : 'detail',
        color: file.color || Color.WHITE, // Default color if not specified
        variant: file.variant,
      };
    });

    // Create base product data
    const productData: Partial<ProductDocument> = {
      name,
      quantity: parseInt(quantity, 10),
      basePrice: parseFloat(basePrice),
      productType,
      category,
      colors: colors.split(','),
      description,
      images: processedImages,
      isActive: true,
    };

    // Add type-specific fields
    if (productType === ProductType.CLOTHING) {
      Object.assign(productData, {
        sizes: sizes.split(','),
        gender: gender.split(','),
        measurements: JSON.parse(measurements || '{}'),
      });
    } else if (productType === ProductType.ACCESSORY) {
      Object.assign(productData, {
        deviceVariants: JSON.parse(deviceVariants || '[]'),
        dimensions: JSON.parse(dimensions || '{}'),
      });
    }

    const newProduct = await createProduct(productData);
    res.status(httpStatus.CREATED).json({
      message: 'Product created successfully',
      // eslint-disable-next-line no-underscore-dangle
      productId: newProduct._id,
    });
  } catch (error) {
    logger.error(`Product creation error: %O`, error);

    // Clean up uploaded images
    if (req.uploadedImages?.length) {
      await Promise.all(
        req.uploadedImages.map((img) =>
          cloudinary.uploader.destroy(img.public_id),
        ),
      );
    }

    next(new AppError(httpStatus.BAD_REQUEST, 'Product creation failed'));
  }
};

/**
 * Retrieves product by ID with all its variants and metadata
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const readProd = async (req: Request, res: Response) => {
  try {
    const productRead = await readProduct(req.params.id);
    if (!productRead) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'Product not found',
      });
    }
    return res.status(httpStatus.OK).json({ data: productRead });
  } catch (error) {
    logger.error(`Error reading product: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error retrieving product',
    });
  }
};

/**
 * Updates product quantity
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateQuantity = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const updatedProduct = await updateProduct(productId, {
      quantity: parseInt(quantity, 10),
    });

    if (!updatedProduct) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'Product not found',
      });
    }

    return res.status(httpStatus.OK).json({
      message: 'Quantity updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    logger.error(`Error updating quantity: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error updating quantity',
    });
  }
};

/**
 * Adds new color variant to a product
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const addColorVariant = async (req: Request, res: Response) => {
  try {
    const { productId, color } = req.body;

    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $addToSet: { colors: color } },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'Product not found',
      });
    }

    return res.status(httpStatus.OK).json({
      message: 'Color variant added successfully',
      product: updatedProduct,
    });
  } catch (error) {
    logger.error(`Error adding color variant: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error adding color variant',
    });
  }
};

/**
 * Removes a color variant from a product
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const removeColorVariant = async (req: Request, res: Response) => {
  try {
    const { productId, color } = req.body;

    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $pull: { colors: color } },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'Product not found',
      });
    }

    return res.status(httpStatus.OK).json({
      message: 'Color variant removed successfully',
      product: updatedProduct,
    });
  } catch (error) {
    logger.error(`Error removing color variant: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error removing color variant',
    });
  }
};

/**
 * Gets product variants by name and optional gender
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getProductVariants = async (req: Request, res: Response) => {
  try {
    const { name, gender } = req.query;
    const query: any = { name };

    if (gender) {
      query.gender = { $in: [gender] };
    }

    const products = await product.find(query);

    if (!products.length) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: 'No products found',
      });
    }

    return res.status(httpStatus.OK).json({ products });
  } catch (error) {
    logger.error(`Error getting product variants: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error retrieving product variants',
    });
  }
};

export {
  createProd,
  readProd,
  updateQuantity,
  addColorVariant,
  removeColorVariant,
  getProductVariants,
};
