import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  createFinalProduct,
  getAllProductsByDesign,
  getAllProductsByDesigner,
  getCategoriesWithoutFinalProducts,
} from './finalprod.controller';

const router: Router = Router();

router.post(
  '/finalproduct/categories-without-products/:designerId',
  [protectedByApiKey],
  getCategoriesWithoutFinalProducts,
);

router.get(
  '/finalproduct/products/design/:designId',
  [protectedByApiKey],
  getAllProductsByDesign,
);

router.get(
  '/finalproduct/products/designer/:designerId',
  [protectedByApiKey],
  getAllProductsByDesigner,
);

// create new design
router.post(
  '/finalproduct/create-final-products',
  [protectedByApiKey],
  cloudinaryMiddleware,
  createFinalProduct,
);

export default router;
