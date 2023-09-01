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

const createUserValidation: ValidationSchema = {
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

export default createUserValidation;
