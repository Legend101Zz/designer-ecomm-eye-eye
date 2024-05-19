import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { Color, Category, Size } from './product.interface';

const createProductValidation: ValidationSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    quantity: Joi.string()
      .regex(/^\d+$/)
      .required()
      .custom((value, helpers) => {
        const quantity = parseInt(value, 10);
        if (Number.isNaN(quantity) || quantity < 0) {
          return helpers.message({
            custom: '"quantity" must be a non-negative integer',
          });
        }
        return quantity;
      }),
    color: Joi.string()
      .optional()
      .custom((value, helpers) => {
        const colors = value.split(',');
        const invalidColors = colors.filter(
          (color) => !Object.values(Color).includes(color),
        );
        if (invalidColors.length > 0) {
          return helpers.message({
            custom: `"color" contains invalid values: ${invalidColors.join(
              ', ',
            )}`,
          });
        }
        return colors;
      }),
    category: Joi.string()
      .valid(...Object.values(Category))
      .required(),
    sizes: Joi.string()
      .optional()
      .custom((value, helpers) => {
        const sizes = value.split(',');
        const invalidSizes = sizes.filter(
          (size) => !Object.values(Size).includes(size),
        );
        if (invalidSizes.length > 0) {
          return helpers.message({
            custom: `"sizes" contains invalid values: ${invalidSizes.join(
              ', ',
            )}`,
          });
        }
        return sizes;
      }),
    basePrice: Joi.string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .required()
      .custom((value, helpers) => {
        const basePrice = parseFloat(value);
        if (Number.isNaN(basePrice) || basePrice < 0) {
          return helpers.message({
            custom: '"basePrice" must be a non-negative number',
          });
        }
        return basePrice;
      }),
  }),
};

const createQuantityValidation: ValidationSchema = {
  body: Joi.object().keys({
    quantity: Joi.string()
      .regex(/^\d+$/)
      .required()
      .custom((value, helpers) => {
        const quantity = parseInt(value, 10);
        if (Number.isNaN(quantity) || quantity < 0) {
          return helpers.message({
            custom: '"quantity" must be a non-negative integer',
          });
        }
        return quantity;
      }),
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

const createColorValidation: ValidationSchema = {
  body: Joi.object().keys({
    color: Joi.string()
      .valid(...Object.values(Color))
      .required(),
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

export {
  createProductValidation,
  createQuantityValidation,
  createColorValidation,
};
