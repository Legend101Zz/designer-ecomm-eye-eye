import { Router, Request, Response } from 'express';
import passport from 'passport';
import logger from '@core/utils/logger';
import { isLoggedIn } from '@core/middlewares/userAuth.middleware';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import createUserValidation from './createUserValidation';
import { createUser } from './user.controller';
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

  res.send(`Thank You for signing in`);
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
  (req: any, res: Response) => {
    console.log('check', req.user);
    req.session.userData = req.user;
    console.log('check2', req.session);
    res.redirect('/api/success');
  },
);

router.get('/logout', (req: any, res) => {
  req.session = null;
  req.logout(); // Use the logout method without arguments
  res.redirect('/api/user');
});

router.post(
  '/user/create',
  [protectedByApiKey, validation(createUserValidation)],
  createUser,
);

export default router;
