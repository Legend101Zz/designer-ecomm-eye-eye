import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import userAddressValidation from '@components/user/userAddress.validation';

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
const designerValidationSchema: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    fullname: Joi.string().optional(),
    artistName: Joi.string().optional(),
    description: Joi.string().optional(),
    portfolioLinks: Joi.array().items(Joi.string().uri()).optional(),
    cvLinks: Joi.array().items(Joi.string().uri()).optional(),
    phone: Joi.string()
      .regex(/^\d{10}$/)
      .optional(),
    panCardNumber: Joi.string().optional(),
    addressBody: userAddressValidation,
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
  designerValidationSchema,
};
