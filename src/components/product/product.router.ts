import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import createProductValidation from './createProduct.validation';
import { createProd, readProd } from './product.controller';

const router: Router = Router();

// get routes

router.get('/product/read/:id', [protectedByApiKey], readProd);

// post routes
router.post(
  '/product/create',
  [protectedByApiKey, validation(createProductValidation)],
  createProd,
);

export default router;
