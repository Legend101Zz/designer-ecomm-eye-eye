import { Router, Request, Response } from 'express';
import passport from 'passport';
import './auth';
import { isLoggedIn } from '@core/middlewares/userAuth.middleware';
// import logger from '@core/utils/logger';

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'You are not logged in' });
});

router.get('/failed', (req, res: Response) => {
  res.send('Failed');
});
router.get('/success', isLoggedIn, (req: Request, res: Response) => {
  res.send(`Welcome ${req}`);
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
    failureRedirect: '/failed',
  }),
  (req, res: Response) => {
    res.redirect('/success');
  },
);

router.get('/logout', (req: any, res) => {
  req.session = null;
  req.logout(); // Use the logout method without arguments
  res.redirect('/');
});

export default router;
