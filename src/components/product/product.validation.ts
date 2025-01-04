import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import {
  ProductType,
  ClothingCategory,
  AccessoryCategory,
  Color,
  Size,
  Gender,
} from './product.interface';

/**
 * Validation schema for creating a new product
 */
const createProductValidation: ValidationSchema = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(100),
    quantity: Joi.number().integer().min(0).required(),
    productType: Joi.string()
      .valid(...Object.values(ProductType))
      .required(),
    category: Joi.string()
      .required()
      .custom((value, helpers) => {
        const { productType } = helpers.state.ancestors[0];

        if (productType === ProductType.CLOTHING) {
          return Object.values(ClothingCategory).includes(value)
            ? value
            : helpers.error('any.invalid');
        }

        return Object.values(AccessoryCategory).includes(value)
          ? value
          : helpers.error('any.invalid');
      }),
    colors: Joi.string()
      .required()
      .custom((value) => {
        const colors = value.split(',');
        const invalidColors = colors.filter(
          (color) => !Object.values(Color).includes(color as Color),
        );
        if (invalidColors.length > 0) {
          throw new Error(`Invalid colors: ${invalidColors.join(', ')}`);
        }
        return value;
      }),
    basePrice: Joi.number().positive().required(),
    description: Joi.string().max(1000).optional(),
    // Clothing specific fields
    sizes: Joi.when('productType', {
      is: ProductType.CLOTHING,
      then: Joi.string()
        .required()
        .custom((value) => {
          const sizes = value.split(',');
          const invalidSizes = sizes.filter(
            (size) => !Object.values(Size).includes(size as Size),
          );
          if (invalidSizes.length > 0) {
            throw new Error(`Invalid sizes: ${invalidSizes.join(', ')}`);
          }
          return value;
        }),
      otherwise: Joi.string().optional(),
    }),
    gender: Joi.when('productType', {
      is: ProductType.CLOTHING,
      then: Joi.string()
        .required()
        .custom((value) => {
          const genders = value.split(',');
          const invalidGenders = genders.filter(
            (gender) => !Object.values(Gender).includes(gender as Gender),
          );
          if (invalidGenders.length > 0) {
            throw new Error(`Invalid genders: ${invalidGenders.join(', ')}`);
          }
          return value;
        }),
      otherwise: Joi.string().optional(),
    }),
    measurements: Joi.when('productType', {
      is: ProductType.CLOTHING,
      then: Joi.string()
        .custom((value) => {
          try {
            const measurementsObj = JSON.parse(value);
            // Validate the structure of measurements object
            const validSizes = Object.values(Size);
            const invalidSizes = Object.keys(measurementsObj).filter(
              (size) => !validSizes.includes(size as Size),
            );

            if (invalidSizes.length > 0) {
              throw new Error(
                `Invalid size keys in measurements: ${invalidSizes.join(', ')}`,
              );
            }
            return value;
          } catch (error) {
            throw new Error('Invalid measurements JSON format');
          }
        })
        .optional(),
      otherwise: Joi.forbidden(),
    }),
    // Accessory specific fields
    deviceVariants: Joi.when('productType', {
      is: ProductType.ACCESSORY,
      then: Joi.string()
        .custom((value) => {
          try {
            JSON.parse(value);
            return value;
          } catch (error) {
            throw new Error('Invalid deviceVariants JSON format');
          }
        })
        .optional(),
      otherwise: Joi.forbidden(),
    }),
    dimensions: Joi.when('productType', {
      is: ProductType.ACCESSORY,
      then: Joi.string()
        .custom((value) => {
          try {
            const dims = JSON.parse(value);
            if (!dims.width || !dims.height) {
              throw new Error('Dimensions must include width and height');
            }
            return value;
          } catch (error) {
            throw new Error('Invalid dimensions format');
          }
        })
        .optional(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

/**
 * Validation schema for updating product quantity
 */
const updateQuantityValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
      }),
    quantity: Joi.number().integer().min(0).required(),
  }),
};

/**
 * Validation schema for color operations
 */
const colorOperationValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required(),
  }),
};

/**
 * Validation schema for product image operations
 */
const productImageValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required(),
    position: Joi.string().valid('front', 'back', 'side', 'detail').required(),
  }),
};

export {
  createProductValidation,
  updateQuantityValidation,
  colorOperationValidation,
  productImageValidation,
};
