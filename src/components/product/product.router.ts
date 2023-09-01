import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import { createProd } from './product.controller';

const router: Router = Router();

// routes to be added

export default router;
