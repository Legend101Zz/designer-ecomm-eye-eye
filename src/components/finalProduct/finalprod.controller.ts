import { Request, Response, NextFunction, Express } from 'express';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import AppError from '@core/utils/appError';
import logger from '@core/utils/logger';
import { product } from '../product/product.model';
import { design } from '../design/design.model';
import { finalProduct } from './finalprod.model';
import { Gender, Size } from '../product/product.interface';
import { IDesignPlacement, IProductVariant } from './finalprod.interface';

/**
 * Types for request/response data structures
 */
// interface ProcessedImage {
//   baseProductId: string;
//   color: Color;
//   front: string; // base64 or file path
//   back: string; // base64 or file path
// }

// interface ProductVariantRequest {
//   baseProductId: string;
//   color: Color;
// }

// interface DesignPlacementRequest {
//   designId: string;
//   position: 'front' | 'back';
//   coordinates: {
//     x: number;
//     y: number;
//   };
//   scale?: number;
//   rotation?: number;
// }

// interface CreateProductRequest {
//   productName: string;
//   gender: Gender;
//   designPrice: number;
//   designs: string; // JSON string
//   variants: string; // JSON string
//   imageMetadata: string; // JSON string containing baseProductId and color
//   tags?: string; // Optional JSON string
// }

interface DesignGroupImages {
  gender: Gender;
  images: {
    front: { url: string; filename: string }[];
    back: { url: string; filename: string }[];
  };
}

interface ProcessedImagesResponse {
  productId: string;
  productName: string;
  designGroups: DesignGroupImages[];
}

interface ProcessedImage extends Express.Multer.File {
  position?: string;
  url?: string;
}

interface CustomRequest extends Request {
  processedImages: ProcessedImage[];
}

/**
 * Helper function to handle Cloudinary image upload
 * @param imageData - Base64 or path to image
 * @param folder - Cloudinary folder path
 * @returns Promise resolving to upload result
 */
// async function uploadToCloudinary(imageData: string, folder: string) {
//   try {
//     const result = await cloudinary.uploader.upload(imageData, {
//       folder,
//       resource_type: 'image',
//     });
//     return result;
//   } catch (error) {
//     logger.error(`Failed to upload image to ${folder}:`, error);
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Failed to upload image',
//     );
//   }
// }

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
      designs: designsJson, // to indicate it's JSON string
      variants: variantsJson, // to indicate it's JSON string
      // imageMetadata,
    } = req.body;

    // Log the incoming data
    logger.debug('Creating final product with data:');

    // Parse JSON strings
    const designs = JSON.parse(designsJson);
    const variants = JSON.parse(variantsJson);
    // const parsedMetadata = JSON.parse(imageMetadata || '{}');

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

    // STEP 2: Process Variant Images
    // Maps processed images from middleware to their respective variants
    const processedImagesByVariant = variants.map((variant) => {
      // Find front and back images
      const frontImage = req.processedImages.find(
        (img) => img.position === 'front',
      );
      const backImage = req.processedImages.find(
        (img) => img.position === 'back',
      );

      logger.debug('Processing images for variant:', {
        variant,
        frontImage,
        backImage,
      });

      return {
        baseProductId: variant.baseProductId,
        color: variant.color,
        images: {
          front: {
            url: frontImage?.url,
            filename: frontImage?.filename,
          },
          back: {
            url: backImage?.url,
            filename: backImage?.filename,
          },
        },
      };
    });

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
        front: [
          {
            url: req.processedImages.find((img) => img.position === 'front')
              ?.url,
            filename: req.processedImages.find(
              (img) => img.position === 'front',
            )?.filename,
          },
        ],
        back: [
          {
            url: req.processedImages.find((img) => img.position === 'back')
              ?.url,
            filename: req.processedImages.find((img) => img.position === 'back')
              ?.filename,
          },
        ],
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

    // After successfully saving the final product
    // Update all used designs with this final product ID and increment appliedCount
    try {
      // Get unique design IDs from all design groups
      const uniqueDesignIds = [
        ...new Set(designs.map((design1) => design1.designId)),
      ];

      // Update all designs in one operation
      await design.updateMany(
        { _id: { $in: uniqueDesignIds } },
        {
          // eslint-disable-next-line no-underscore-dangle
          $addToSet: { finalProduct: finalProd._id }, // Add to finalProduct array if not already present
          $inc: { appliedCount: 1 }, // Increment appliedCount
        },
      );

      logger.info(
        `Updated ${uniqueDesignIds.length} designs with final product reference`,
      );

      // Return success response
      res.status(httpStatus.CREATED).json({
        success: true,
        // eslint-disable-next-line no-underscore-dangle
        productId: finalProd._id,
        message: 'Final product created successfully',
      });
    } catch (updateError) {
      logger.error('Error updating designs:', updateError);
      throw new Error(updateError);
    }
  } catch (error) {
    logger.error('Error in createFinalProduct:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      files: req.processedImages,
    });
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
            .filter((v) => v.baseProductId)
            .map((v) => {
              // Since we're using lean(), stock is already a plain object, not a Map
              const stockData = typeof v.stock === 'object' ? v.stock : {};

              return {
                baseProductId: v.baseProductId._id,
                // @ts-ignore
                productName: v.baseProductId.name,
                // @ts-ignore
                category: v.baseProductId.category,
                color: v.color,
                stock: stockData, // Use the object directly
                images: {
                  front: group.processedImages.front[0]?.url,
                  back: group.processedImages.back[0]?.url,
                },
              };
            }),
        })),
    }));

    logger.debug(`Found ${formattedProducts.length} products matching filters`);

    res.status(httpStatus.OK).json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    console.error('Error in getFilteredProducts:', {
      error: error.message,
      stack: error.stack,
    });
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
            front: group.processedImages.front[0]?.url,
            back: group.processedImages.back[0]?.url,
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

/**
 * Get processed images with flexible filtering
 *
 * @route GET /api/finalproduct/images
 * @query productId - Optional specific product ID
 * @query gender - Optional gender filter
 * @query category - Optional category filter
 * @query productName - Optional product name filter (partial match)
 * @query designId - Optional design ID filter
 */
export async function getProcessedImages(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId, gender, category, productName, designId } = req.query;

    // Build query based on provided filters
    const query: any = { isActive: true };

    // Single product query
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId as string)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid product ID');
      }
      // eslint-disable-next-line no-underscore-dangle
      query._id = new mongoose.Types.ObjectId(productId as string);
    }

    // Apply additional filters if provided
    if (gender) {
      query['designGroups.gender'] = gender;
    }

    if (category) {
      query['designGroups.variants.baseProductId.category'] = category;
    }

    if (productName) {
      // eslint-disable-next-line security/detect-non-literal-regexp
      query.productName = new RegExp(productName as string, 'i');
    }

    if (designId) {
      if (!mongoose.Types.ObjectId.isValid(designId as string)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid design ID');
      }
      query['designGroups.designs.designId'] = new mongoose.Types.ObjectId(
        designId as string,
      );
    }

    // Fetch products with minimal field selection
    const products = await finalProduct
      .find(query)
      .select('productName designGroups.gender designGroups.processedImages')
      .populate({
        path: 'designGroups.variants.baseProductId',
        select: 'category',
      })
      .lean();

    // Format response
    const response: ProcessedImagesResponse[] = products.map((prod) => ({
      // eslint-disable-next-line no-underscore-dangle
      productId: prod._id.toString(),
      productName: prod.productName,
      designGroups: prod.designGroups.map((group) => ({
        gender: group.gender,
        images: {
          front: group.processedImages.front.map((img) => ({
            url: img.url,
            filename: img.filename,
          })),
          back: group.processedImages.back.map((img) => ({
            url: img.url,
            filename: img.filename,
          })),
        },
      })),
    }));

    logger.debug(`Found ${response.length} products with processed images`);

    res.status(httpStatus.OK).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching processed images:', {
      error: error.message,
      stack: error.stack,
    });
    next(
      error instanceof AppError
        ? error
        : new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Error fetching processed images',
          ),
    );
  }
}
