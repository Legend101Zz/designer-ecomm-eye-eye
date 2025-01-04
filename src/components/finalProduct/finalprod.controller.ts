import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import AppError from '@core/utils/appError';
import mongoose from 'mongoose';
import { product } from '@components/product/product.model';
import { design } from '@components/design/design.model';
import { finalProduct } from './finalprod.model';
import {
  IDesignApplication,
  IProductVariant,
  IDesignGroup,
  IFinalProduct,
} from './finalprod.interface';

interface CustomRequest extends Request {
  files: any[];
  uploadedImages?: Array<{ url: string; public_id: string }>;
}

/**
 * Helper function to create a properly typed design group
 */
const createDesignGroup = (data: {
  name: string;
  designs: Partial<IDesignApplication>[];
  variants: Partial<IProductVariant>[];
}): IDesignGroup => {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: data.name,
    designs: data.designs as IDesignApplication[],
    variants: data.variants as IProductVariant[],
  };
};

/**
 * Helper function to find a design group by ID
 */
const findDesignGroup = (
  product1: IFinalProduct,
  groupId: string,
): IDesignGroup | null => {
  return (
    // eslint-disable-next-line no-underscore-dangle
    product1.designGroups.find((g) => g._id.toString() === groupId) || null
  );
};

/**
 * Helper function to find a variant in a design group
 */
const findVariant = (
  group: IDesignGroup,
  variantId: string,
): IProductVariant | null => {
  // eslint-disable-next-line no-underscore-dangle
  return group.variants.find((v) => v._id?.toString() === variantId) || null;
};

/**
 * Creates a new final product with design applications and variants
 * @route POST /api/finalproduct/create
 */
const createFinalProduct = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const uploadedFiles: Array<{ url: string; filename: string }> = [];
  try {
    const {
      baseProductId,
      productName,
      designGroupName,
      designs,
      variants,
      basePrice,
      tags,
    } = req.body;

    // Validate base product exists
    const baseProduct = await product.findById(baseProductId);
    if (!baseProduct) {
      throw new AppError(httpStatus.NOT_FOUND, 'Base product not found');
    }

    // Process uploaded images if any
    if (req.files?.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const file of req.files) {
        uploadedFiles.push({
          url: file.path,
          filename: file.filename,
        });
      }
    }

    // Process design applications with proper typing
    const processedDesigns = await Promise.all(
      JSON.parse(designs).map(
        async (designData: {
          designId: string;
          position: 'front' | 'back';
          scale?: number;
          rotation?: number;
          coordinates?: { x: number; y: number };
          appliedImage: { url: string; filename: string };
        }) => {
          const existingDesign = await design.findById(designData.designId);
          if (!existingDesign) {
            throw new Error(`Design not found: ${designData.designId}`);
          }

          return {
            _id: new mongoose.Types.ObjectId(),
            // eslint-disable-next-line no-underscore-dangle
            designId: existingDesign._id,
            designerId: existingDesign.designer,
            position: designData.position,
            scale: designData.scale || 1,
            rotation: designData.rotation || 0,
            coordinates: designData.coordinates,
            appliedImage: designData.appliedImage,
          };
        },
      ),
    );

    // Process variants with proper typing
    const processedVariants = JSON.parse(variants).map((variantData: any) => ({
      _id: new mongoose.Types.ObjectId(),
      color: variantData.color,
      gender: variantData.gender,
      sizes: variantData.sizes,
      baseImages: variantData.baseImages,
      processedImages: variantData.processedImages,
      price: variantData.price,
      stock: new Map(Object.entries(variantData.stock)),
    }));

    // Create the initial design group
    const initialGroup = createDesignGroup({
      name: designGroupName,
      designs: processedDesigns,
      variants: processedVariants,
    });

    // Create final product
    const newFinalProduct = await finalProduct.create({
      baseProductId,
      productName,
      basePrice: parseFloat(basePrice),
      category: baseProduct.category,
      tags: JSON.parse(tags),
      designGroups: [initialGroup],
    });

    res.status(httpStatus.CREATED).json({
      success: true,
      // eslint-disable-next-line no-underscore-dangle
      productId: newFinalProduct._id,
      message: 'Final product created successfully',
    });
  } catch (error) {
    logger.error('Final product creation error:', error);

    // Clean up uploaded files if any
    if (uploadedFiles.length) {
      await Promise.all(
        uploadedFiles.map((file) => cloudinary.uploader.destroy(file.filename)),
      );
    }

    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

/**
 * Adds a new design group to an existing product
 * @route POST /api/finalproduct/:productId/designgroup
 */
const addDesignGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;
    const { designGroupName, designs, variants } = req.body;

    const existingProduct = await finalProduct
      .findById(productId)
      .populate('baseProductId')
      .populate('designGroups.designs.designId')
      .populate('designGroups.designs.designerId');

    if (!existingProduct) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const processedDesigns = await Promise.all(
      JSON.parse(designs).map(
        async (designData: {
          designId: string;
          position: 'front' | 'back';
          scale?: number;
          rotation?: number;
          coordinates?: { x: number; y: number };
          appliedImage: { url: string; filename: string };
        }) => {
          const existingDesign = await design.findById(designData.designId);
          if (!existingDesign) {
            throw new Error(`Design not found: ${designData.designId}`);
          }

          return {
            _id: new mongoose.Types.ObjectId(),
            // eslint-disable-next-line no-underscore-dangle
            designId: existingDesign._id,
            designerId: existingDesign.designer,
            position: designData.position,
            scale: designData.scale || 1,
            rotation: designData.rotation || 0,
            coordinates: designData.coordinates,
            appliedImage: designData.appliedImage,
          };
        },
      ),
    );

    const processedVariants = JSON.parse(variants).map((variantData: any) => ({
      _id: new mongoose.Types.ObjectId(),
      color: variantData.color,
      gender: variantData.gender,
      sizes: variantData.sizes,
      baseImages: variantData.baseImages,
      processedImages: variantData.processedImages,
      price: variantData.price,
      stock: new Map(Object.entries(variantData.stock)),
    }));

    const newGroup = createDesignGroup({
      name: designGroupName,
      designs: processedDesigns,
      variants: processedVariants,
    });

    existingProduct.designGroups.push(newGroup);
    await existingProduct.save();

    res.status(httpStatus.OK).json({
      success: true,
      // eslint-disable-next-line no-underscore-dangle
      groupId: newGroup._id,
      message: 'Design group added successfully',
    });
  } catch (error) {
    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

/**
 * Gets product variants filtered by gender
 * @route GET /api/finalproduct/:productId/variants/:gender
 */
const getVariantsByGender = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, gender } = req.params;

    const finalProd = await finalProduct
      .findById(productId)
      .populate('baseProductId')
      .populate('designGroups.designs.designId', 'title')
      .populate('designGroups.designs.designerId', 'artistName');

    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const groupedVariants = finalProd.designGroups.map((group) => ({
      // eslint-disable-next-line no-underscore-dangle
      groupId: group._id,
      name: group.name,
      designs: group.designs.map((design1) => ({
        designName: design1.designId?.title || 'Unknown Design',
        designerName: design1.designerId?.artistName || 'Unknown Designer',
        position: design1.position,
      })),
      variants: group.variants
        .filter((v) => v.gender === gender)
        .map((v) => ({
          // eslint-disable-next-line no-underscore-dangle
          variantId: v._id,
          color: v.color,
          sizes: v.sizes,
          price: v.price,
          // eslint-disable-next-line node/no-unsupported-features/es-builtins
          stock: Object.fromEntries(v.stock),
          images: v.processedImages,
        })),
    }));

    res.status(httpStatus.OK).json({
      success: true,
      productName: finalProd.productName,
      category: finalProd.category,
      variants: groupedVariants,
    });
  } catch (error) {
    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

/**
 * Updates stock levels for product variants
 * @route PATCH /api/finalproduct/:productId/stock
 */
const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { updates } = req.body;

    const finalProd = await finalProduct.findById(productId);
    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const stockUpdates = JSON.parse(updates);
    // eslint-disable-next-line no-restricted-syntax
    for (const update of stockUpdates) {
      const group = findDesignGroup(finalProd, update.groupId);
      if (!group) continue;

      const variant = findVariant(group, update.variantId);
      if (!variant) continue;

      update.stock.forEach((stockItem: { size: string; quantity: number }) => {
        variant.stock.set(stockItem.size, stockItem.quantity);
      });
    }

    await finalProd.save();

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

/**
 * Gets filtered products by category and/or gender
 * @route GET /api/finalproduct/list
 */
const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category, gender } = req.query;

    const query: any = {};
    if (category) query.category = category;

    const products = await finalProduct
      .find(query)
      .populate('baseProductId')
      .populate('designGroups.designs.designId', 'title')
      .populate('designGroups.designs.designerId', 'artistName');

    const filteredProducts = products.map((prod) => {
      const groupedByGender = prod.designGroups.map((group) => ({
        // eslint-disable-next-line no-underscore-dangle
        groupId: group._id,
        name: group.name,
        designs: group.designs.map((design1) => ({
          designName: design1.designId?.title || 'Unknown Design',
          designerName: design1.designerId?.artistName || 'Unknown Designer',
        })),
        variants: gender
          ? group.variants
              .filter((v) => v.gender === gender)
              .map((v) => ({
                color: v.color,
                previewImage: v.processedImages.front,
                price: v.price,
              }))
          : group.variants.map((v) => ({
              gender: v.gender,
              color: v.color,
              previewImage: v.processedImages.front,
              price: v.price,
            })),
      }));

      return {
        // eslint-disable-next-line no-underscore-dangle
        productId: prod._id,
        productName: prod.productName,
        category: prod.category,
        basePrice: prod.basePrice,
        designGroups: groupedByGender,
      };
    });

    res.status(httpStatus.OK).json({
      success: true,
      products: filteredProducts,
    });
  } catch (error) {
    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

/**
 * Gets detailed product information for a specific product
 * @route GET /api/finalproduct/:productId
 */
const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const finalProd = await finalProduct
      .findById(productId)
      .populate('baseProductId')
      .populate('designGroups.designs.designId', 'title')
      .populate('designGroups.designs.designerId', 'artistName');

    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    const response = {
      // eslint-disable-next-line no-underscore-dangle
      productId: finalProd._id,
      productName: finalProd.productName,
      category: finalProd.category,
      basePrice: finalProd.basePrice,
      tags: finalProd.tags,
      designGroups: finalProd.designGroups.map((group) => ({
        // eslint-disable-next-line no-underscore-dangle
        groupId: group._id,
        name: group.name,
        designs: group.designs.map((design1) => ({
          designName: design1.designId?.title || 'Unknown Design',
          designerName: design1.designerId?.artistName || 'Unknown Designer',
          position: design1.position,
          scale: design1.scale,
          rotation: design1.rotation,
          coordinates: design1.coordinates,
          appliedImage: design1.appliedImage,
        })),
        variants: group.variants.map((v) => ({
          variantId: v._id,
          color: v.color,
          gender: v.gender,
          sizes: v.sizes,
          images: {
            base: v.baseImages,
            processed: v.processedImages,
          },
          price: v.price,
          // eslint-disable-next-line node/no-unsupported-features/es-builtins
          stock: Object.fromEntries(v.stock),
        })),
      })),
    };

    res.status(httpStatus.OK).json({
      success: true,
      product: response,
    });
  } catch (error) {
    next(new AppError(httpStatus.BAD_REQUEST, error.message));
  }
};

export {
  createFinalProduct,
  addDesignGroup,
  getVariantsByGender,
  updateStock,
  getFilteredProducts,
  getProductDetails,
};
