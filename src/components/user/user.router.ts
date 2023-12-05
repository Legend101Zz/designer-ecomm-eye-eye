import { Router, Request, Response } from 'express';
import passport from 'passport';
import logger from '@core/utils/logger';
import { isLoggedIn } from '@core/middlewares/userAuth.middleware';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import { designer } from '@components/designer/designer.model';
import {
  createUserValidation,
  createAddressValidation,
} from './createUserValidation';
import {
  addToCart,
  changeCartQuantity,
  removeFromCart,
  createUser,
  updatePassword,
  loginUser,
  addAddress,
  followDesigner,
  updateUser,
} from './user.controller';
import './auth';

// import logger from '@core/utils/logger';

const router: Router = Router();

// google auth routes
router.get('/user', (req: Request, res: Response) => {
  res.json({ message: 'You are not logged in' });
});

router.get('/user/data', [protectedByApiKey], isLoggedIn, (req: any, res) => {
  res.json(req.session.userData);
});

router.get('/failed', (req, res: Response) => {
  res.send('Failed');
});
router.get('/success', (req: any, res: Response) => {
  logger.debug(req);
  res.json(req.session.userData);
  // res.send(`Thank You for signing in`);
});

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  }),
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureMessage: 'Cannot Connect to Google Servers, Please try later ',
    failureRedirect: '/api/failed',
  }),
  async (req: any, res: Response) => {
    // Clone the user data to avoid modifying the original object
    const modifiedUserData = { ...req.user.toObject() };

    // Add logic to get the total quantity from the cart
    const totalQuantity = modifiedUserData.cart.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    // Omit sensitive or unnecessary fields
    delete modifiedUserData.addresses;
    delete modifiedUserData.following;
    delete modifiedUserData.password;
    delete modifiedUserData.googleId;

    // Update the cart field with the total quantity
    modifiedUserData.cart = totalQuantity;

    // Add logic to set designerId if the user is a designer
    if (modifiedUserData.isDesigner) {
      const designerCheck = await designer.findOne({
        // eslint-disable-next-line no-underscore-dangle
        userId: modifiedUserData._id,
      });
      if (designerCheck) {
        // eslint-disable-next-line no-underscore-dangle
        modifiedUserData.designerId = designerCheck._id;
      }
    }

    // Store the modified user data in the session
    req.session.userData = modifiedUserData;

    // Log the total quantity
    console.log(totalQuantity, modifiedUserData);

    // Return the modified user data in the response
    res.json(req.session.userData);
  },
);

router.get('/logout', (req: any, res) => {
  req.session = null;
  req.logout(); // Use the logout method without arguments
  res.redirect('/api/user');
});

// other routes

router.post(
  '/user/addAddress',
  [protectedByApiKey, validation(createAddressValidation)],
  addAddress,
);

router.post(
  '/user/create',
  [protectedByApiKey, validation(createUserValidation)],
  createUser,
);

router.post('/user/update-password', [protectedByApiKey], updatePassword);

router.post('/user/follow', [protectedByApiKey], followDesigner);

router.post('/user/login', [protectedByApiKey], loginUser);

router.post('/user/profile', [protectedByApiKey], updateUser);

// cart routes

router.post('/user/addToCart', [protectedByApiKey], addToCart);

router.post('/user/updateCart', [protectedByApiKey], changeCartQuantity);

router.post('/user/deleteFromCart', [protectedByApiKey], removeFromCart);

export default router;
