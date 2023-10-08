import { Router } from 'express';
import protectedByApiKey from '../../core/middlewares/apiKey.middleware';
import validation from '../../core/middlewares/validate.middleware';
import { createTransaction } from './transcations.controller';
import { createProductsValidation } from './createTransactionValidation';

const router: Router = Router();

router.get(
  '/transactions/initiate',
  [protectedByApiKey, validation(createProductsValidation)],
  createTransaction,
);

export default router;
