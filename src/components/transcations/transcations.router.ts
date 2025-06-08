import { Router } from 'express';
import protectedByApiKey from '../../core/middlewares/apiKey.middleware';
import validation from '../../core/middlewares/validate.middleware';
import { authenticate } from '../../core/middlewares/userAuth.middleware';
import {
  createTransaction,
  updateTransaction,
  getTransaction,
  getUserTransactions,
  verifyPayment,
  handleWebhook,
} from './transcations.controller';
import {
  createProductsValidation,
  updateTransactionValidation,
  verifyPaymentValidation,
  getTransactionValidation,
  getUserTransactionsValidation,
} from './createTransactionValidation';

const router: Router = Router();

/**
 * Transaction Management Routes
 */

// Create a new transaction
router.post(
  '/transactions/initiate',
  [protectedByApiKey, validation(createProductsValidation)],
  authenticate,
  createTransaction,
);

// Verify payment after frontend confirmation
router.post(
  '/transactions/:transactionId/verify',
  [protectedByApiKey, validation(verifyPaymentValidation)],
  authenticate,
  verifyPayment,
);

// Webhook endpoint for Razorpay callbacks (no authentication needed)
router.post(
  '/transactions/webhook/razorpay',
  [protectedByApiKey],
  handleWebhook,
);

// Update an existing transaction
router.put(
  '/transactions/:transactionId',
  [protectedByApiKey, validation(updateTransactionValidation)],
  authenticate,
  updateTransaction,
);

// Get a specific transaction by ID
router.get(
  '/transactions/:transactionId',
  [protectedByApiKey, validation(getTransactionValidation)],
  authenticate,
  getTransaction,
);

// Get all transactions for a specific user
router.get(
  '/transactions/user/:userId',
  [protectedByApiKey, validation(getUserTransactionsValidation)],
  authenticate,
  getUserTransactions,
);

export default router;
