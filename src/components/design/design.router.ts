import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { showDesigns } from './design.controller';

const router: Router = Router();

router.get(
  '/designs/show',
  [protectedByApiKey],

  showDesigns,
);

export default router;
