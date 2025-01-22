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
  getProductsByType,
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

router.get('/product/read/:id', [protectedByApiKey], readProd);

router.get('/products/by-type', [protectedByApiKey], getProductsByType);

export default router;
