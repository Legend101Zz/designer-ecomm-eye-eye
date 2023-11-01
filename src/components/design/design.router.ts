import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { showDesigns, updateDesign } from './design.controller';

const router: Router = Router();

router.get('/designs/show', [protectedByApiKey], showDesigns);
router.get('/designs/update/:designId', [protectedByApiKey], updateDesign);

export default router;
