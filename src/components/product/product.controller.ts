import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import AppError from '@core/utils/appError';
import { product } from '@components/product/product.model';
import {
  ProductType,
  IProductImage,
  ProductDocument,
  Color,
  ClothingCategory,
  AccessoryCategory,
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
      deviceVariants, // not compulsory
      dimensions, // not compulsory
      measurements, // not compulsory
    } = req.body;

    // Process images with proper metadata
    const processedImages: IProductImage[] = req.files.map((file, index) => {
      return {
        url: file.path,
        filename: file.filename,
        color: colors.split(',')[0] || Color.WHITE,
        // eslint-disable-next-line no-nested-ternary
        position: index === 0 ? 'front' : index === 1 ? 'back' : 'detail',
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
    const { name, gender, fields } = req.query;

    // Base query
    const query: any = {};
    if (name) query.name = name;
    if (gender) query.gender = { $in: [gender] };

    // Fields projection
    let projection: any = null;
    if (fields) {
      projection = fields
        .toString()
        .split(',')
        .reduce((acc: Record<string, 1>, field: string) => {
          acc[field.trim()] = 1;
          return acc;
        }, {});
    }

    const products = await product.find(query, projection); // Pass projection here

    // Check if products exist
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

/**
 * Gets products by type with optional gender filter
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getProductsByType = async (req: Request, res: Response) => {
  try {
    const { type, gender } = req.query;

    // Validate product type
    if (!type || !Object.values(ProductType).includes(type as ProductType)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid product type',
      });
    }

    // Build query
    const query: any = {
      productType: type,
      isActive: true,
    };

    // Add gender filter if provided
    if (gender) {
      query.gender = { $in: [gender] };
    }

    // Get products with required fields
    const products = await product.find(query).select({
      name: 1,
      productType: 1,
      category: 1,
      colors: 1,
      images: {
        url: 1,
        position: 1,
        color: 1,
      },
      sizes: 1,
      gender: 1,
      isActive: 1,
    });

    if (!products.length) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'No products found',
      });
    }

    // Format response
    const formattedProducts = products.map((p) => ({
      // eslint-disable-next-line no-underscore-dangle
      id: p._id,
      name: p.name,
      productType: p.productType,
      category: p.category,
      colors: p.colors,
      // Group images by color
      images: p.colors.reduce((acc: any, color: string) => {
        acc[color] = {};
        const colorImages = p.images.filter((img) => img.color === color);
        colorImages.forEach((img) => {
          acc[color][img.position] = img.url;
        });
        return acc;
      }, {}),
      sizes: p.sizes,
      gender: p.gender,
    }));

    logger.info(`Retrieved ${products.length} products of type ${type}`);

    return res.status(httpStatus.OK).json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    logger.error(`Error getting products by type: %O`, error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error retrieving products',
    });
  }
};

/**
 * Get available categories from base products
 *
 * Returns all unique categories currently available in the database,
 * grouped by product type for better organization
 *
 * @route GET /api/product/categories
 * @param req Request object
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 */
const getAvailableCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get distinct categories and product types from active products
    const categoriesData = await product.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: {
            productType: '$productType',
            category: '$category',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.productType',
          categories: {
            $push: {
              name: '$_id.category',
              count: '$count',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format the response
    const formattedCategories = categoriesData.map((item) => ({
      productType: item._id,
      categories: item.categories.sort((a, b) => a.name.localeCompare(b.name)),
    }));

    // Also get a flat list of all categories for convenience
    const allCategories = await product.distinct('category', {
      isActive: true,
    });
    const sortedAllCategories = allCategories.sort();

    // Get enum values for reference
    const availableEnums = {
      clothing: Object.values(ClothingCategory),
      accessories: Object.values(AccessoryCategory),
      productTypes: Object.values(ProductType),
    };

    logger.debug(
      `Found ${sortedAllCategories.length} unique categories across ${formattedCategories.length} product types`,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        categoriesByType: formattedCategories,
        allCategories: sortedAllCategories,
        totalCategories: sortedAllCategories.length,
        availableEnums,
      },
    });
  } catch (error) {
    logger.error('Error fetching available categories:', error);
    next(
      new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching categories',
      ),
    );
  }
};

/**
 * Get categories for a specific product type
 *
 * @route GET /api/product/categories/:productType
 * @param req Request object with productType parameter
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 */
const getCategoriesByProductType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productType } = req.params;

    // Validate product type
    if (!Object.values(ProductType).includes(productType as ProductType)) {
      return next(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid product type: ${productType}`,
        ),
      );
    }

    // Get categories for the specific product type
    const categories = await product.aggregate([
      {
        $match: {
          isActive: true,
          productType,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    // Get enum values for this product type
    const availableEnums =
      productType === ProductType.CLOTHING
        ? Object.values(ClothingCategory)
        : Object.values(AccessoryCategory);

    logger.debug(
      `Found ${categories.length} categories for product type: ${productType}`,
    );

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        productType,
        categories,
        totalCategories: categories.length,
        availableEnums,
      },
    });
  } catch (error) {
    logger.error(
      `Error fetching categories for product type ${req.params.productType}:`,
      error,
    );
    next(
      new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Error fetching categories',
      ),
    );
  }
};

export {
  createProd,
  readProd,
  updateQuantity,
  addColorVariant,
  removeColorVariant,
  getProductVariants,
  getProductsByType,
  getAvailableCategories,
  getCategoriesByProductType,
};
