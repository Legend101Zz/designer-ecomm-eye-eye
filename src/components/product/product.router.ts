import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  createProd,
  readProd,
  updateQuantity,
  addColorVariant,
  removeColorVariant,
  getProductVariants,
} from './product.controller';
import {
  createProductValidation,
  updateQuantityValidation,
  colorOperationValidation,
} from './product.validation';

const router: Router = Router();

// Product Creation and Retrieval Routes
router.post(
  '/product/create',
  [
    protectedByApiKey,
    cloudinaryMiddleware,
    validation(createProductValidation),
  ],
  createProd,
);

router.get('/product/:id', [protectedByApiKey], readProd);

// Product Variant Management Routes
router.get('/product/variants', [protectedByApiKey], getProductVariants);

// Product Update Routes
router.patch(
  '/product/quantity',
  [protectedByApiKey, validation(updateQuantityValidation)],
  updateQuantity,
);

router.post(
  '/product/color',
  [protectedByApiKey, validation(colorOperationValidation)],
  addColorVariant,
);

router.delete(
  '/product/color',
  [protectedByApiKey, validation(colorOperationValidation)],
  removeColorVariant,
);

export default router;
