import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { finalProductUploadMiddleware } from '@core/middlewares/cloudinary';
import { authenticate } from '@core/middlewares/userAuth.middleware';
import {
  createFinalProduct,
  getFilteredProducts,
  getProductDetails,
  updateStock,
  deactivateProduct,
  getProcessedImages,
  getProductsCount,
} from './finalprod.controller';

const router: Router = Router();

// Create new final product with designs
router.post(
  '/finalproduct/create',
  [protectedByApiKey, authenticate],
  finalProductUploadMiddleware,
  createFinalProduct,
);

// Get filtered products list
router.get('/finalproduct/list', [protectedByApiKey], getFilteredProducts);

// Get product count
router.get('/finalproduct/count', [protectedByApiKey], getProductsCount);

// Get processed images with optional filters
router.get('/finalproduct/images', [protectedByApiKey], getProcessedImages);

// Get single product details
router.get('/finalproduct/:productId', [protectedByApiKey], getProductDetails);

// Update stock levels
router.patch(
  '/finalproduct/:productId/stock',
  [protectedByApiKey],
  updateStock,
);

// Deactivate product
router.patch(
  '/finalproduct/:productId/deactivate',
  [protectedByApiKey],
  deactivateProduct,
);

export default router;
