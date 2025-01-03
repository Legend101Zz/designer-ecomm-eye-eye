import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import {
  showDesigns,
  updateDesign,
  getDesignerDesigns,
  getRandomDesigns,
} from './design.controller';

const router: Router = Router();

router.get('/designs/show', [protectedByApiKey], showDesigns);

router.get('/designs/random', [protectedByApiKey], getRandomDesigns);

router.get(
  '/designs/designer/:designerId',
  [protectedByApiKey],
  getDesignerDesigns,
);
router.post('/designs/update/:designId', [protectedByApiKey], updateDesign);

export default router;
