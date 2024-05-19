import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { Color, Category, Size } from './product.interface';

const createProductValidation: ValidationSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(0).required(),
    color: Joi.array()
      .items(Joi.string().valid(...Object.values(Color)))
      .when('category', {
        is: Joi.valid('shirt', 'Tshirt', 'hoodie'),
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
      }),
    category: Joi.string()
      .valid(...Object.values(Category))
      .required(),
    sizes: Joi.array()
      .items(Joi.string().valid(...Object.values(Size)))
      .when('category', {
        is: Joi.valid('shirt', 'Tshirt', 'hoodie'),
        then: Joi.array().min(1).required(),
        otherwise: Joi.forbidden(),
      }),
    basePrice: Joi.number().min(0).required(),
  }),
};

const createQuantityValidation: ValidationSchema = {
  body: Joi.object().keys({
    quantity: Joi.number().integer().min(0).required(),
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
