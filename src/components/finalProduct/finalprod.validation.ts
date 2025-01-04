import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { Gender, Color, Size } from '../product/product.interface';

/**
 * Coordinates validation schema
 * Ensures design placement coordinates are within valid bounds (0-100 for both x and y)
 * These values represent percentage positions on the product
 */
const coordinatesSchema = Joi.object({
  x: Joi.number().required().min(0).max(100).messages({
    'number.min': 'X coordinate must be between 0 and 100',
    'number.max': 'X coordinate must be between 0 and 100',
    'any.required': 'X coordinate is required',
  }),
  y: Joi.number().required().min(0).max(100).messages({
    'number.min': 'Y coordinate must be between 0 and 100',
    'number.max': 'Y coordinate must be between 0 and 100',
    'any.required': 'Y coordinate is required',
  }),
});

/**
 * Processed image validation schema
 * Validates image data for each color variant
 * Requires base64 encoded images for both front and back views
 */
const processedImageSchema = Joi.object({
  baseProductId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid base product ID format',
      'any.required': 'Base product ID is required for each variant',
    }),
  color: Joi.string()
    .valid(...Object.values(Color))
    .required()
    .messages({
      'any.only': 'Invalid color specified',
      'any.required': 'Color is required for each variant',
    }),
  front: Joi.string()
    .required()
    .pattern(/^data:image\/(jpeg|png|jpg);base64,/)
    .message('Front image must be a valid base64 encoded image'),
  back: Joi.string()
    .required()
    .pattern(/^data:image\/(jpeg|png|jpg);base64,/)
    .message('Back image must be a valid base64 encoded image'),
});

/**
 * Variant validation schema
 * Validates product variant information including stock levels
 */
const variantSchema = Joi.object({
  baseProductId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid base product ID format',
      'any.required': 'Base product ID is required',
    }),
  color: Joi.string()
    .valid(...Object.values(Color))
    .required()
    .messages({
      'any.only': 'Invalid color specified',
      'any.required': 'Color is required',
    }),
  // Stock is handled automatically from base product
});

/**
 * Design placement validation schema
 * Validates individual design placement configuration
 */
const designPlacementSchema = Joi.object({
  designId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid design ID format',
      'any.required': 'Design ID is required',
    }),
  position: Joi.string().valid('front', 'back').required().messages({
    'any.only': 'Position must be either front or back',
    'any.required': 'Position is required',
  }),
  coordinates: coordinatesSchema.required(),
  scale: Joi.number().min(0.1).max(5).default(1).messages({
    'number.min': 'Scale cannot be less than 0.1',
    'number.max': 'Scale cannot exceed 5',
  }),
  rotation: Joi.number().min(-360).max(360).default(0).messages({
    'number.min': 'Rotation must be between -360 and 360 degrees',
    'number.max': 'Rotation must be between -360 and 360 degrees',
  }),
});

/**
 * Create final product validation schema
 * Main validation schema for creating new final products
 */
export const createFinalProductValidation: ValidationSchema = {
  body: Joi.object({
    productName: Joi.string().required().min(3).max(100).trim().messages({
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 100 characters',
      'any.required': 'Product name is required',
    }),
    gender: Joi.string()
      .valid(...Object.values(Gender))
      .required()
      .messages({
        'any.only': 'Invalid gender specified',
        'any.required': 'Gender is required',
      }),
    designPrice: Joi.number().min(0).default(0).messages({
      'number.min': 'Design price cannot be negative',
    }),
    designs: Joi.array()
      .min(1)
      .max(10)
      .items(designPlacementSchema)
      .required()
      .messages({
        'array.min': 'At least one design is required',
        'array.max': 'Cannot exceed 10 designs per product',
        'any.required': 'Designs are required',
      }),
    variants: Joi.array()
      .min(1)
      .items(variantSchema)
      .unique(
        (a, b) => a.baseProductId === b.baseProductId && a.color === b.color,
      )
      .required()
      .messages({
        'array.min': 'At least one variant is required',
        'array.unique': 'Duplicate variant combinations are not allowed',
        'any.required': 'Variants are required',
      }),
    processedImages: Joi.array()
      .items(processedImageSchema)
      .min(1)
      .required()
      .custom((value, helpers) => {
        // Cross validate that processed images match variants
        const { variants } = helpers.state.ancestors[0];
        if (!variants) return value;

        const imageKeys = value.map(
          (img) => `${img.baseProductId}_${img.color}`,
        );
        const variantKeys = variants.map(
          (v) => `${v.baseProductId}_${v.color}`,
        );

        const missingImages = variantKeys.filter(
          (key) => !imageKeys.includes(key),
        );
        const extraImages = imageKeys.filter(
          (key) => !variantKeys.includes(key),
        );

        if (missingImages.length || extraImages.length) {
          return helpers.error('array.mismatch', {
            missing: missingImages,
            extra: extraImages,
          });
        }
        return value;
      })
      .messages({
        'array.min': 'At least one processed image set is required',
        'array.mismatch': 'Processed images must match variants exactly',
        'any.required': 'Processed images are required',
      }),
  }),
};

/**
 * Stock update validation schema
 * Validates stock update requests
 */
export const updateStockValidation: ValidationSchema = {
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
      }),
  }),
  body: Joi.object({
    groupId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid group ID format',
      }),
    baseProductId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid base product ID format',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required()
      .messages({
        'any.only': 'Invalid color specified',
      }),
    size: Joi.string()
      .valid(...Object.values(Size))
      .required()
      .messages({
        'any.only': 'Invalid size specified',
      }),
    quantity: Joi.number().integer().min(0).required().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
    }),
  }),
};

/**
 * Product listing validation schema
 * Validates query parameters for product listing
 */
export const listProductsValidation: ValidationSchema = {
  query: Joi.object({
    category: Joi.string(),
    gender: Joi.string()
      .valid(...Object.values(Gender))
      .messages({
        'any.only': 'Invalid gender specified',
      }),
    baseProductId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid base product ID format',
      }),
  }),
};

/**
 * Product ID parameter validation schema
 * Validates route parameters containing product IDs
 */
export const productIdParamValidation: ValidationSchema = {
  params: Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
      }),
  }),
};
