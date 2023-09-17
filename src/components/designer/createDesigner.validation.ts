import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createDesignerValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

const updateDesignerValidationSchema: ValidationSchema = {
  body: Joi.object().keys({
    designerId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    legal_first_name: Joi.string().allow(''),
    legal_last_name: Joi.string().allow(''),
    description: Joi.string().allow(''),
    legal_address: Joi.string().allow(''),
    socialMedia: Joi.array().items(Joi.string()),
    portfolioLinks: Joi.array().items(Joi.string()),
  }),
};

// eslint-disable-next-line import/prefer-default-export
export { createDesignerValidation, updateDesignerValidationSchema };
