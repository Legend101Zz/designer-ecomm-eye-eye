import { Router } from 'express';
import protectedByApiKey from '../../core/middlewares/apiKey.middleware';
import validation from '../../core/middlewares/validate.middleware';
import {
  createTransaction,
  updateTransaction,
} from './transcations.controller';
import {
  createTransactionValidation,
  updateTransactionValidation,
} from './createTransactionValidation';

const router: Router = Router();

router.post(
  '/transactions/initiate',
  [protectedByApiKey, validation(createTransactionValidation)],
  createTransaction,
);

router.patch(
  '/transactions/update',
  [protectedByApiKey, validation(updateTransactionValidation)],
  updateTransaction,
);

export default router;
