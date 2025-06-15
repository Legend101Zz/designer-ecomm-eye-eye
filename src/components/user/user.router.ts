import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import { authenticate } from '@core/middlewares/userAuth.middleware';
import {
  createUserValidation,
  createAddressValidation,
  addToCartValidation,
  changeCartQuantityValidation,
  removeFromCartValidation,
} from './createUserValidation';
import {
  // User Management
  createUser,
  handleGoogleAuth,
  loginUser,
  updatePassword,
  updateUser,
  getUserInfo,

  // Address Management
  addAddress,
  getAddress,

  // Designer Following
  followDesigner,
  unfollowDesigner,

  // Shopping Cart
  addToCart,
  changeCartQuantity,
  removeFromCart,
  getUserCart,
  clearCart,
} from './user.controller';

const router: Router = Router();

/**
 * User Management Routes
 * Handles core user functionality like creation, authentication, and profile management
 */

// Create new user with email verification
router.post(
  '/user/create',
  [protectedByApiKey, validation(createUserValidation)],
  createUser,
);

// Create new user with email verification using google
router.post('/user/google-auth', [protectedByApiKey], handleGoogleAuth);

// Authenticate user with email/password
router.post('/user/login', [protectedByApiKey], loginUser);

// Update user's password
router.post('/user/update-password', [protectedByApiKey], updatePassword);

// Update user's profile information
router.post('/user/profile', [protectedByApiKey], updateUser);

// Get user's basic information
router.get('/user/info/:userId', [protectedByApiKey], getUserInfo);

/**
 * Address Management Routes
 * Handles user shipping/billing addresses
 */

// Add new address for user
router.post(
  '/user/addAddress',
  [protectedByApiKey, authenticate, validation(createAddressValidation)],
  addAddress,
);

// Get user's addresses
router.get('/user/address/:userId', [protectedByApiKey], getAddress);
router.get('/user/address', [protectedByApiKey], authenticate, getAddress);
/**
 * Designer Following Routes
 * Handles user-designer relationship management
 */

// Follow a designer
router.post('/user/follow', [protectedByApiKey], followDesigner);

// Unfollow a designer
router.post('/user/unfollow', [protectedByApiKey], unfollowDesigner);

/**
 * Shopping Cart Routes
 * Handles shopping cart operations
 */

// Get user's cart contents
router.get('/user/getCart/', [protectedByApiKey], authenticate, getUserCart);

// Add item to cart
router.post(
  '/user/addToCart',
  [protectedByApiKey],
  validation(addToCartValidation),
  authenticate,
  addToCart,
);

// Update cart item quantity
router.post(
  '/user/updateCart',
  [protectedByApiKey, validation(changeCartQuantityValidation)],
  authenticate,
  changeCartQuantity,
);

// Remove item from cart
router.post(
  '/user/deleteFromCart',
  [protectedByApiKey, validation(removeFromCartValidation)],
  authenticate,
  removeFromCart,
);

// Clear entire cart
router.post('/user/clearCart', [protectedByApiKey], authenticate, clearCart);

export default router;
