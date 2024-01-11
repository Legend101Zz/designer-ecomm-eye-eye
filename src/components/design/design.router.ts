import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import {
  showDesigns,
  updateDesign,
  addProductsToDesign,
} from './design.controller';

const router: Router = Router();

router.get('/designs/show', [protectedByApiKey], showDesigns);
router.get('/designs/designer/:designId', [protectedByApiKey], showDesigns);
router.get('/designs/update/:designId', [protectedByApiKey], updateDesign);
router.post('/designs/add-products', [protectedByApiKey], addProductsToDesign);

export default router;
