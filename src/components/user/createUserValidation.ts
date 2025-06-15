import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { Size, Color } from '../product/product.interface';

const createUserValidation: ValidationSchema = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email(),
  }),
};

const createAddressValidation: ValidationSchema = {
  body: Joi.object().keys({
    address_line1: Joi.string().required(),
    address_line2: Joi.string(),
    city: Joi.string().required(),
    postal_code: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    address_type: Joi.string().required(),
  }),
};

const addToCartValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
    quantity: Joi.number().integer().min(1).required().messages({
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
    size: Joi.string()
      .valid(...Object.values(Size))
      .required()
      .messages({
        'any.only': 'Invalid size specified',
        'any.required': 'Size is required',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required()
      .messages({
        'any.only': 'Invalid color specified',
        'any.required': 'Color is required',
      }),
  }),
};

const changeCartQuantityValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
    quantity: Joi.number().integer().min(1).required().messages({
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
    size: Joi.string()
      .valid(...Object.values(Size))
      .required()
      .messages({
        'any.only': 'Invalid size specified',
        'any.required': 'Size is required',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required()
      .messages({
        'any.only': 'Invalid color specified',
        'any.required': 'Color is required',
      }),
  }),
};

const removeFromCartValidation: ValidationSchema = {
  body: Joi.object().keys({
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid product ID format',
        'any.required': 'Product ID is required',
      }),
    size: Joi.string()
      .valid(...Object.values(Size))
      .required()
      .messages({
        'any.only': 'Invalid size specified',
        'any.required': 'Size is required',
      }),
    color: Joi.string()
      .valid(...Object.values(Color))
      .required()
      .messages({
        'any.only': 'Invalid color specified',
        'any.required': 'Color is required',
      }),
  }),
};

export {
  createUserValidation,
  createAddressValidation,
  addToCartValidation,
  changeCartQuantityValidation,
  removeFromCartValidation,
};
