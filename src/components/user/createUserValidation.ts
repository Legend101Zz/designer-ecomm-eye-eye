import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createUserValidation: ValidationSchema = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email(),
    password: Joi.string().required(),
  }),
};

export default createUserValidation;
