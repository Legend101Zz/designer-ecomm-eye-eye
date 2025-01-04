import Joi from 'joi';
import { ValidationSchema } from '@core/interfaces/validationSchema';
import { Color, Gender, Size } from '../product/product.interface';

const designApplicationSchema = Joi.object({
  designId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  position: Joi.string().valid('front', 'back').required(),
  scale: Joi.number().min(0.1).max(5).optional(),
  rotation: Joi.number().min(-360).max(360).optional(),
  coordinates: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).optional(),
  appliedImage: Joi.object({
    url: Joi.string().required(),
    filename: Joi.string().required(),
  }).required(),
});

const variantSchema = Joi.object({
  color: Joi.string()
    .valid(...Object.values(Color))
    .required(),
  gender: Joi.string()
    .valid(...Object.values(Gender))
    .required(),
  sizes: Joi.array()
    .items(Joi.string().valid(...Object.values(Size)))
    .min(1)
    .required(),
  baseImages: Joi.object({
    front: Joi.string().required(),
    back: Joi.string().required(),
  }).required(),
  processedImages: Joi.object({
    front: Joi.string().required(),
    back: Joi.string().required(),
  }).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.object()
    .pattern(Joi.string().valid(...Object.values(Size)), Joi.number().min(0))
    .required(),
});

export const createFinalProductValidation: ValidationSchema = {
  body: Joi.object().keys({
    baseProductId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    productName: Joi.string().min(3).max(100).required(),
    designGroupName: Joi.string().required(),
    designs: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array()
            .items(designApplicationSchema)
            .min(1)
            .validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
    variants: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array()
            .items(variantSchema)
            .min(1)
            .validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
    basePrice: Joi.number().min(0).required(),
    tags: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array().items(Joi.string()).validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
  }),
};

export const addDesignGroupValidation: ValidationSchema = {
  params: Joi.object().keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  body: Joi.object().keys({
    designGroupName: Joi.string().required(),
    designs: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array()
            .items(designApplicationSchema)
            .min(1)
            .validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
    variants: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array()
            .items(variantSchema)
            .min(1)
            .validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
  }),
};

export const updateStockValidation: ValidationSchema = {
  params: Joi.object().keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  body: Joi.object().keys({
    variantUpdates: Joi.string()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          const validation = Joi.array()
            .items(
              Joi.object({
                groupId: Joi.string()
                  .regex(/^[0-9a-fA-F]{24}$/)
                  .required(),
                variantId: Joi.string()
                  .regex(/^[0-9a-fA-F]{24}$/)
                  .required(),
                stock: Joi.array()
                  .items(
                    Joi.object({
                      size: Joi.string()
                        .valid(...Object.values(Size))
                        .required(),
                      quantity: Joi.number().min(0).required(),
                    }),
                  )
                  .min(1)
                  .required(),
              }),
            )
            .validate(parsed);

          if (validation.error) {
            return helpers.error('any.invalid');
          }
          return value;
        } catch {
          return helpers.error('any.invalid');
        }
      })
      .required(),
  }),
};

export const getVariantsValidation: ValidationSchema = {
  params: Joi.object().keys({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
    gender: Joi.string()
      .valid(...Object.values(Gender))
      .required(),
  }),
};
