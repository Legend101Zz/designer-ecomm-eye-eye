import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createDesignerValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

// eslint-disable-next-line import/prefer-default-export
export { createDesignerValidation };
