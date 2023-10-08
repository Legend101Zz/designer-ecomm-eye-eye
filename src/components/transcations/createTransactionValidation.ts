import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createProductsValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    Address: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    products: Joi.array()
      .items(
        Joi.object().keys({
          product: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/) // Assuming it's a MongoDB ObjectId
            .required(),
          quantity: Joi.number().integer().min(1).required(),
        }),
      )
      .required(),
  }),
};

// eslint-disable-next-line import/prefer-default-export
export { createProductsValidation };
