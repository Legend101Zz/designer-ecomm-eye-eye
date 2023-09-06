import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

enum Color {
  red = 'red',
  black = 'black',
  white = 'white',
  yellow = 'yellow',
}

enum Category {
  shirt = 'shirt',
  Tshirt = 'Tshirt',
  Cup = 'cup',
}

const createProductValidation: ValidationSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(0).required(),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required(),
    category: Joi.string()
      .valid(...Object.values(Category))
      .required(),
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
