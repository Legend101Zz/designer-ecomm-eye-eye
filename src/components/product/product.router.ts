import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import {
  addColor,
  changeQuan,
  createProd,
  deleteColor,
  readProd,
} from './product.controller';
import {
  createQuantityValidation,
  createProductValidation,
  createColorValidation,
} from './createProduct.validation';

const router: Router = Router();

// get routes

router.get('/product/read/:id', [protectedByApiKey], readProd);

// post routes
router.post(
  '/product/create',
  [protectedByApiKey, validation(createProductValidation)],
  createProd,
);

router.post(
  '/product/quantity',
  [protectedByApiKey, validation(createQuantityValidation)],
  changeQuan,
);

router.post(
  '/product/addColor',
  [protectedByApiKey, validation(createColorValidation)],
  addColor,
);

router.post(
  '/product/deleteColor',
  [protectedByApiKey, validation(createColorValidation)],
  deleteColor,
);

export default router;
