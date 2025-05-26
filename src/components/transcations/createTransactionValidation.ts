import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';

const createTransactionValidation: ValidationSchema = {
  body: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    Address: Joi.string().required(),
    products: Joi.array()
      .items(
        Joi.object().keys({
          product: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/) // Assuming it's a MongoDB ObjectId
            .required(),
          quantity: Joi.number().integer().min(1).required(),
        }),
      )
      .required(),
  }),
};

const updateTransactionValidation: ValidationSchema = {
  body: Joi.object().keys({
    transactionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    status: Joi.string().valid('paid', 'failed').required(),
  }),
};

// eslint-disable-next-line import/prefer-default-export
export { createTransactionValidation, updateTransactionValidation };
