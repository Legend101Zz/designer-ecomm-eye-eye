import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

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
    user_id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

export { createUserValidation, createAddressValidation };
