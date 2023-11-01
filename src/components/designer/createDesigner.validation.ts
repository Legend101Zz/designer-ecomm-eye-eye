import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createDesignerValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

// const imageValidationSchema = Joi.object().keys({
//   image: Joi.any().required().meta({ type: 'file' }),
// });

const requestDesignerValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    fullname: Joi.string().required(),
    artistName: Joi.string().required(),
    description: Joi.string().required(),
    panCardNumber: Joi.string().required(),
    phone: Joi.number().required(),
    portfolioLinks: Joi.string().required(),
    cvLinks: Joi.string().required(),
    address_line1: Joi.string().required(),
    address_line2: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postal_code: Joi.string().required(),
    country: Joi.string().required(),
    address_type: Joi.string().required(),

    // Add validation for any other fields in req.body if needed
  }),
};

const updateDesignerValidationSchema: ValidationSchema = {
  body: Joi.object().keys({
    designerId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    updates: Joi.object().keys({
      legal_first_name: Joi.string().allow(''),
      legal_last_name: Joi.string().allow(''),
      description: Joi.string().allow(''),
      legal_address: Joi.string().allow(''),
      socialMedia: Joi.array().items(Joi.string()),
      portfolioLinks: Joi.array().items(Joi.string()),
    }),
  }),
};

const createDesignValidationSchema: ValidationSchema = {
  body: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    designerId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    productId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

// eslint-disable-next-line import/prefer-default-export
export {
  createDesignerValidation,
  updateDesignerValidationSchema,
  createDesignValidationSchema,
  requestDesignerValidation,
};
