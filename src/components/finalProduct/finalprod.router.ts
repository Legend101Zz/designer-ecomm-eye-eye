import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  createFinalProduct,
  addDesignGroup,
  getVariantsByGender,
  updateStock,
  getFilteredProducts,
  getProductDetails,
} from './finalprod.controller';
import {
  createFinalProductValidation,
  addDesignGroupValidation,
  getVariantsValidation,
  updateStockValidation,
} from './finalprod.validation';

const router: Router = Router();

// Create and manage final products
router.post(
  '/finalproduct/create',
  [
    protectedByApiKey,
    cloudinaryMiddleware,
    validation(createFinalProductValidation),
  ],
  createFinalProduct,
);

// Add new design group to existing product
router.post(
  '/finalproduct/:productId/designgroup',
  [protectedByApiKey, validation(addDesignGroupValidation)],
  addDesignGroup,
);

// Get variants by gender
router.get(
  '/finalproduct/:productId/variants/:gender',
  [protectedByApiKey, validation(getVariantsValidation)],
  getVariantsByGender,
);

// Update stock levels
router.patch(
  '/finalproduct/:productId/stock',
  [protectedByApiKey, validation(updateStockValidation)],
  updateStock,
);

// Get filtered products
router.get('/finalproduct/list', [protectedByApiKey], getFilteredProducts);

// Gets detailed product information for a specific product
router.get('/finalproduct/:productId', [protectedByApiKey], getProductDetails);

export default router;
