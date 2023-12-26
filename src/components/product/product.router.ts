import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  addColor,
  changeQuan,
  createProd,
  deleteColor,
  readProd,
  addProductImages,
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

router
  .route('/product/productPhotos')

  .post(
    [protectedByApiKey],
    cloudinaryMiddleware, // Use the Cloudinary middleware here
    addProductImages,
  );

export default router;
