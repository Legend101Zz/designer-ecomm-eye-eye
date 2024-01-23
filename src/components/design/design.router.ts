import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  showDesigns,
  updateDesign,
  addProductsToDesign,
  getProducts,
} from './design.controller';

const router: Router = Router();

router.get('/designs/show', [protectedByApiKey], showDesigns);
router.get('/designs/getProducts', [protectedByApiKey], getProducts);
router.get('/designs/designer/:designId', [protectedByApiKey], showDesigns);
router.get('/designs/update/:designId', [protectedByApiKey], updateDesign);
router.post(
  '/designs/add-products',
  [protectedByApiKey],
  cloudinaryMiddleware,
  addProductsToDesign,
);

export default router;
