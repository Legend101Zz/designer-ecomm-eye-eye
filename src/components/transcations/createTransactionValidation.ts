import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { PaymentProvider, TransactionStatus } from './transcations.interface';
import { Size, Color } from '../product/product.interface';

const createProductsValidation: ValidationSchema = {
  body: Joi.object().keys({
    Address: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    paymentProvider: Joi.string()
      .valid(...Object.values(PaymentProvider))
      .required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().length(3).default('INR').optional(),
    products: Joi.array()
      .items(
        Joi.object().keys({
          product: Joi.string()
            .regex(/^[0-9a-fA-F]{24}$/) // Assuming it's a MongoDB ObjectId
            .required(),
          quantity: Joi.number().integer().min(1).required(),
          size: Joi.string()
            .valid(...Object.values(Size))
            .optional(),
          color: Joi.string()
            .valid(...Object.values(Color))
            .optional(),
        }),
      )
      .required(),
  }),
};

const updateTransactionValidation: ValidationSchema = {
  params: Joi.object().keys({
    transactionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string()
        .valid(...Object.values(TransactionStatus))
        .optional(),
      paymentProvider: Joi.string()
        .valid(...Object.values(PaymentProvider))
        .optional(),
      isCompleted: Joi.boolean().optional(),
      amount: Joi.number().min(0).optional(),
      currency: Joi.string().length(3).optional(),
      paymentDetails: Joi.object()
        .keys({
          paymentIntentId: Joi.string().optional(),
          paymentMethodId: Joi.string().optional(),
          receiptUrl: Joi.string().uri().optional(),
        })
        .optional(),
    })
    .min(1), // At least one field is required for update
};

const verifyPaymentValidation: ValidationSchema = {
  params: Joi.object().keys({
    transactionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  body: Joi.object().keys({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
  }),
};

const getTransactionValidation: ValidationSchema = {
  params: Joi.object().keys({
    transactionId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

const getUserTransactionsValidation: ValidationSchema = {
  params: Joi.object().keys({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  query: Joi.object().keys({
    status: Joi.string()
      .valid(...Object.values(TransactionStatus))
      .optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
  }),
};

export {
  createProductsValidation,
  updateTransactionValidation,
  verifyPaymentValidation,
  getTransactionValidation,
  getUserTransactionsValidation,
};
