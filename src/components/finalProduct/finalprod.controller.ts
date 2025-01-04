import { Request, Response, NextFunction } from 'express';
import { Multer } from 'multer';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import AppError from '@core/utils/appError';
import logger from '@core/utils/logger';
import { product } from '../product/product.model';
import { design } from '../design/design.model';
import { finalProduct } from './finalprod.model';
import { Gender, Size, Color } from '../product/product.interface';
import { IDesignPlacement, IProductVariant } from './finalprod.interface';

/**
 * Types for request/response data structures
 */
interface ProcessedImage {
  baseProductId: string;
  color: Color;
  front: string; // base64 or file path
  back: string; // base64 or file path
}

interface ProductVariantRequest {
  baseProductId: string;
  color: Color;
}

interface DesignPlacementRequest {
  designId: string;
  position: 'front' | 'back';
  coordinates: {
    x: number;
    y: number;
  };
  scale?: number;
  rotation?: number;
}

interface CreateProductRequest {
  productName: string;
  gender: Gender;
  designPrice: number;
  designs: DesignPlacementRequest[];
  variants: ProductVariantRequest[];
  processedImages: ProcessedImage[];
}

interface CustomRequest extends Request {
  files: Multer.File[];
}

/**
 * Helper function to handle Cloudinary image upload
 * @param imageData - Base64 or path to image
 * @param folder - Cloudinary folder path
 * @returns Promise resolving to upload result
 */
async function uploadToCloudinary(imageData: string, folder: string) {
  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: 'image',
    });
    return result;
  } catch (error) {
    logger.error(`Failed to upload image to ${folder}:`, error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to upload image',
    );
  }
}

/**
 * Creates a new final product with applied designs
 *
 * This endpoint handles:
 * 1. Validation of all input data
 * 2. Processing and uploading of design images
 * 3. Creation of variants with inherited stock levels
 * 4. Organization of products by design groups
 *
 * @route POST /api/finalproduct/create
 * @param req Request containing product creation data
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 * @throws {AppError} If validation fails or processing error occurs
 */
// eslint-disable-next-line import/prefer-default-export
export async function createFinalProduct(
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Track uploaded files for cleanup in case of error
  const uploadedFiles: string[] = [];

  try {
    const {
      productName,
      gender,
      designPrice,
      designs,
      variants,
      processedImages,
    } = req.body as CreateProductRequest;

    logger.debug(`Processing final product creation: ${productName}`);

    // Step 1: Process and validate designs
    const processedDesigns = await Promise.all(
      designs.map(async (designData): Promise<IDesignPlacement> => {
        // Validate design exists and is approved
        const designDoc = await design
          .findById(designData.designId)
          .select('isVerified title designImage designer')
          .populate('designer', 'artistName');

        if (!designDoc?.isVerified) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Design ${designData.designId} not found or not verified`,
          );
        }

        // Return processed design placement
        return {
          // eslint-disable-next-line no-underscore-dangle
          designId: designDoc._id,
          position: designData.position,
          scale: designData.scale || 1,
          rotation: designData.rotation || 0,
          coordinates: designData.coordinates,
        };
      }),
    );

    // Step 2: Process variant images with organized uploads
    const processedImagesByVariant = await Promise.all(
      processedImages.map(async (imgData) => {
        // Create folder structure for images
        const folder = `final-products/${productName}/${gender}/${imgData.color}`;

        // Upload front and back images
        const [frontImage, backImage] = await Promise.all([
          uploadToCloudinary(imgData.front, `${folder}/front`),
          uploadToCloudinary(imgData.back, `${folder}/back`),
        ]);

        // Track uploaded files
        uploadedFiles.push(frontImage.public_id, backImage.public_id);

        return {
          baseProductId: imgData.baseProductId,
          color: imgData.color,
          images: {
            front: {
              url: frontImage.secure_url,
              filename: frontImage.public_id,
            },
            back: {
              url: backImage.secure_url,
              filename: backImage.public_id,
            },
          },
        };
      }),
    );

    // Step 3: Process and validate variants
    const processedVariants = await Promise.all(
      variants.map(async (variantData): Promise<IProductVariant> => {
        // Validate base product exists and is active
        const baseProductDoc = await product.findById(
          variantData.baseProductId,
        );
        if (!baseProductDoc?.isActive) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Base product ${variantData.baseProductId} not found or inactive`,
          );
        }

        // Ensure baseProductDoc is valid
        if (!baseProductDoc) {
          throw new Error('Invalid baseProductDoc');
        }

        // Verify if baseProductDoc contains the same color and gender
        const hasMatchingColor = baseProductDoc.colors.includes(
          variantData.color,
        );
        const hasMatchingGender = baseProductDoc.gender.includes(gender);

        if (!hasMatchingColor || !hasMatchingGender) {
          throw new Error(
            `Base product does not match the required color: ${variantData.color} or gender: ${gender}`,
          );
        }

        // Validate processed images exist for this variant
        const variantImages = processedImagesByVariant.find(
          (img) =>
            img.baseProductId === variantData.baseProductId &&
            img.color === variantData.color,
        );

        if (!variantImages) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Missing processed images for variant: ${variantData.color}`,
          );
        }

        // Create variant with inherited stock levels
        return {
          baseProductId: new mongoose.Types.ObjectId(variantData.baseProductId),
          color: variantData.color,
          stock: new Map(
            baseProductDoc.sizes.map((size) => [
              size,
              baseProductDoc.quantity || 0,
            ]),
          ),
        };
      }),
    );

    // Step 4: Create design group
    const designGroup = {
      name: `${productName} ${gender} Collection`,
      gender,
      designs: processedDesigns,
      variants: processedVariants,
      processedImages: {
        front: processedImagesByVariant.map((v) => v.images.front),
        back: processedImagesByVariant.map((v) => v.images.back),
      },
      designPrice: Number(designPrice) || 0,
    };

    logger.debug('Checking for existing product with same design combination');

    // Step 5: Find or create final product
    let finalProd = await finalProduct.findOne({
      productName,
      'designGroups.designs': {
        $size: designs.length,
        $all: designs.map((d) => ({
          designId: d.designId,
          position: d.position,
        })),
      },
    });

    if (finalProd) {
      // Check for existing gender group
      if (finalProd.designGroups.some((g) => g.gender === gender)) {
        throw new AppError(
          httpStatus.CONFLICT,
          'Design combination already exists for this gender',
        );
      }

      // Add new gender group
      finalProd.designGroups.push(designGroup);
      logger.debug('Added new gender group to existing product');
    } else {
      // Extract tags from form-data
      const tagsString = req.body.tags; // Form-data sends tags as a string
      let tags: string[] = [];

      if (tagsString) {
        // Parse tags into an array
        tags = JSON.parse(tagsString);

        // Ensure it's an array of strings
        if (
          !Array.isArray(tags) ||
          !tags.every((tag) => typeof tag === 'string')
        ) {
          throw new Error('Tags must be an array of strings');
        }
        // Create new final product
        finalProd = await finalProduct.create({
          productName,
          designGroups: [designGroup],
          tags,
        });
        logger.debug('Created new final product');
      }
    }

    // Save changes
    await finalProd.save();

    logger.info(
      // eslint-disable-next-line no-underscore-dangle
      `Successfully created/updated final product ${finalProd._id} ` +
        `with ${processedVariants.length} variants`,
    );

    // Return success response
    res.status(httpStatus.CREATED).json({
      success: true,
      // eslint-disable-next-line no-underscore-dangle
      productId: finalProd._id,
      message: 'Final product created successfully',
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (uploadedFiles.length) {
      logger.debug('Cleaning up uploaded files due to error');
      await Promise.all(
        uploadedFiles.map((publicId) =>
          cloudinary.uploader
            .destroy(publicId)
            .catch((err) =>
              logger.error(`Failed to delete image ${publicId}:`, err),
            ),
        ),
      );
    }

    next(
      error instanceof AppError
        ? error
        : new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Error creating final product',
          ),
    );
  }
}

/**
 * Retrieves a filtered list of final products
 *
 * Supports filtering by:
 * - Category of base product
 * - Gender of design group
 * - Specific base product ID
 *
 * Returns formatted product data with:
 * - Basic product information
 * - Design groups with their variants
 * - Processed images for each variant
 *
 * @route GET /api/finalproduct/list
 * @param req Request with optional query parameters
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 */
export async function getFilteredProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { category, gender, baseProductId } = req.query;
    logger.debug('Getting filtered products:', {
      category,
      gender,
      baseProductId,
    });

    // Build query filters
    const query: any = { isActive: true };

    if (baseProductId) {
      query['designGroups.variants.baseProductId'] = baseProductId;
    }
    if (gender) {
      query['designGroups.gender'] = gender;
    }

    // Fetch products with populated references
    const products = await finalProduct
      .find(query)
      .populate({
        path: 'designGroups.variants.baseProductId',
        select: 'name category tags',
        match: category ? { category } : {},
      })
      .populate({
        path: 'designGroups.designs.designId',
        select: 'title designImage designer',
        populate: {
          path: 'designer',
          select: 'artistName',
        },
      })
      .lean();

    // Filter out products with no matching variants
    const filteredProducts = products.filter(
      (prod) =>
        !category ||
        prod.designGroups.some((group) =>
          group.variants.some((v) => v.baseProductId),
        ),
    );

    // Format response
    const formattedProducts = filteredProducts.map((prod) => ({
      // eslint-disable-next-line no-underscore-dangle
      id: prod._id,
      productName: prod.productName,
      tags: prod.tags,
      designGroups: prod.designGroups
        // Only include groups matching gender filter if specified
        .filter((g) => !gender || g.gender === gender)
        .map((group) => ({
          // eslint-disable-next-line no-underscore-dangle
          // @ts-ignore
          id: group._id,
          name: group.name,
          gender: group.gender,
          designPrice: group.designPrice,
          // Format designs
          designs: group.designs.map((d) => ({
            // eslint-disable-next-line no-underscore-dangle
            id: d.designId._id,
            designName: d.designId.title || 'Unknown Design',
            designerName: d.designId.designer?.artistName || 'Unknown Designer',
            position: d.position,
            scale: d.scale,
            rotation: d.rotation,
            coordinates: d.coordinates,
          })),
          // Format variants
          variants: group.variants
            .filter((v) => v.baseProductId) // Filter out variants with no matching base product
            .map((v) => ({
              // eslint-disable-next-line no-underscore-dangle
              baseProductId: v.baseProductId._id,
              // @ts-ignore
              productName: v.baseProductId.name,
              // @ts-ignore
              category: v.baseProductId.category,
              color: v.color,
              // @ts-ignore
              // eslint-disable-next-line node/no-unsupported-features/es-builtins
              stock: Object.fromEntries(v.quantity),
              // Match images to variant
              images: {
                front: group.processedImages.front.find((img) =>
                  img.filename.includes(v.color.toLowerCase()),
                )?.url,
                back: group.processedImages.back.find((img) =>
                  img.filename.includes(v.color.toLowerCase()),
                )?.url,
              },
            })),
        })),
    }));

    logger.debug(`Found ${formattedProducts.length} products matching filters`);

    res.status(httpStatus.OK).json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    next(
      new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching products'),
    );
  }
}

/**
 * Retrieves detailed information about a single final product
 *
 * Returns comprehensive product data including:
 * - All design groups and their configurations
 * - Complete variant information with stock levels
 * - Processed images for all variants
 * - Total stock and sales information
 *
 * @route GET /api/finalproduct/:productId
 * @param req Request with product ID parameter
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 * @throws {AppError} If product not found
 */
export async function getProductDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId } = req.params;
    logger.debug(`Getting details for product: ${productId}`);

    // Fetch product with populated references
    const finalProd = await finalProduct
      .findById(productId)
      .populate({
        path: 'designGroups.variants.baseProductId',
        select: 'name category tags',
      })
      .populate({
        path: 'designGroups.designs.designId',
        select: 'title designImage designer',
        populate: {
          path: 'designer',
          select: 'artistName',
        },
      });

    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }
    const response = {
      // eslint-disable-next-line no-underscore-dangle
      id: finalProd._id,
      productName: finalProd.productName,
      tags: finalProd.tags,
      designGroups: finalProd.designGroups.map((group) => ({
        // eslint-disable-next-line no-underscore-dangle
        // @ts-ignore
        id: group._id,
        name: group.name,
        gender: group.gender,
        designPrice: group.designPrice,
        // Format design information
        designs: group.designs.map((d) => ({
          // eslint-disable-next-line no-underscore-dangle
          id: d.designId._id,
          designName: d.designId.title || 'Unknown Design',
          designerName: d.designId.designer?.artistName || 'Unknown Designer',
          position: d.position,
          scale: d.scale,
          rotation: d.rotation,
          coordinates: d.coordinates,
        })),
        // Format variant information
        variants: group.variants.map((v) => ({
          // eslint-disable-next-line no-underscore-dangle
          baseProductId: v.baseProductId._id,
          // @ts-ignore
          productName: v.baseProductId.name,
          // @ts-ignore
          category: v.baseProductId.category,
          color: v.color,
          // eslint-disable-next-line node/no-unsupported-features/es-builtins
          stock: Object.fromEntries(v.stock),
          // Match processed images to variant
          images: {
            front: group.processedImages.front.find((img) =>
              img.filename.includes(v.color.toLowerCase()),
            )?.url,
            back: group.processedImages.back.find((img) =>
              img.filename.includes(v.color.toLowerCase()),
            )?.url,
          },
        })),
      })),
      totalStock: finalProd.getTotalStock(),
      sales: finalProd.sales,
      isActive: finalProd.isActive,
      createdAt: finalProd.createdAt,
      updatedAt: finalProd.updatedAt,
    };

    logger.debug(`Successfully retrieved product details: ${productId}`);

    res.status(httpStatus.OK).json({
      success: true,
      product: response,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Error fetching product details',
          ),
    );
  }
}

/**
 * Updates stock levels for a specific variant in a design group
 *
 * This endpoint:
 * - Validates product and variant existence
 * - Updates stock levels for specific size
 * - Ensures non-negative stock values
 * - Handles concurrent updates safely
 *
 * @route PATCH /api/finalproduct/:productId/stock
 * @param req Request containing:
 *    - productId: ID of final product
 *    - groupId: ID of design group
 *    - baseProductId: ID of base product
 *    - color: Color variant
 *    - size: Size to update
 *    - quantity: New stock quantity
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 * @throws {AppError} If product not found or update fails
 */
export async function updateStock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId } = req.params;
    const { groupId, baseProductId, color, size, quantity } = req.body;

    logger.debug('Updating stock:', {
      productId,
      groupId,
      baseProductId,
      color,
      size,
      quantity,
    });

    // Validate inputs
    if (quantity < 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Stock quantity cannot be negative',
      );
    }

    // Find product and validate existence
    const finalProd = await finalProduct.findById(productId);
    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    // Find design group
    // @ts-ignore
    const group = finalProd.designGroups.id(groupId);
    if (!group) {
      throw new AppError(httpStatus.NOT_FOUND, 'Design group not found');
    }

    // Find variant
    const variant = group.variants.find(
      (v) => v.baseProductId.toString() === baseProductId && v.color === color,
    );
    if (!variant) {
      throw new AppError(httpStatus.NOT_FOUND, 'Variant not found');
    }

    // Update stock level
    variant.stock.set(size as Size, quantity);

    // Save changes with optimistic concurrency control
    try {
      await finalProd.save();
    } catch (err) {
      if (err.name === 'VersionError') {
        throw new AppError(
          httpStatus.CONFLICT,
          'Stock was updated by another request, please retry',
        );
      }
      throw err;
    }

    logger.info(
      `Updated stock for product ${productId}, variant ${color}, size ${size} to ${quantity}`,
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Error updating stock',
          ),
    );
  }
}

/**
 * Deactivates a final product
 *
 * This operation:
 * - Sets product isActive flag to false
 * - Maintains historical data
 * - Does not affect existing orders/references
 *
 * Note: Deactivation is reversible through admin intervention
 *
 * @route PATCH /api/finalproduct/:productId/deactivate
 * @param req Request with product ID parameter
 * @param res Response object
 * @param next Next middleware function
 * @returns {Promise<void>}
 * @throws {AppError} If product not found
 */
export async function deactivateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId } = req.params;
    logger.debug(`Deactivating product: ${productId}`);

    // Find and update product
    const finalProd = await finalProduct.findByIdAndUpdate(
      productId,
      {
        isActive: false,
        $set: {
          'designGroups.$[].variants.$[].stock': new Map(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!finalProd) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }

    logger.info(`Successfully deactivated product: ${productId}`);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Product deactivated successfully',
      deactivatedAt: finalProd.updatedAt,
    });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Error deactivating product',
          ),
    );
  }
}
