import Joi from 'joi';

const addressValidationSchema = Joi.object({
  address_line1: Joi.string().required(),
  address_line2: Joi.string().optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postal_code: Joi.string().required(),
  country: Joi.string().required(),
  address_type: Joi.string().required(),
});

export default { addressValidationSchema };
