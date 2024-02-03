import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  createFinalProduct,
  getAllProductsByDesign,
  getAllProductsByDesigner,
} from './finalprod.controller';

const router: Router = Router();

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

router.post(
  '/finalproduct/create-final-products',
  [protectedByApiKey],
  cloudinaryMiddleware,
  createFinalProduct,
);

export default router;
