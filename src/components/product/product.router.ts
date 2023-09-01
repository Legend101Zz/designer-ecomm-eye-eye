import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import createProductValidation from './createProduct.validation';
import { createProd } from './product.controller';

const router: Router = Router();

// routes to be added

router.post(
  '/product/create',
  [protectedByApiKey, validation(createProductValidation)],
  createProd,
);

export default router;
