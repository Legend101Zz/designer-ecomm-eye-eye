import { Router, Request, Response } from 'express';
import passport from 'passport';
import cookieSession from 'cookie-session';
import './auth';
// import logger from '@core/utils/logger';

const router: Router = Router();

router.use(
  cookieSession({
    name: 'google-auth-session',
    keys: ['key1', 'key2'],
  }),
);

router.use(passport.initialize());
router.use(passport.session());

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'You are not logged in' });
});

router.get('/failed', (req, res: Response) => {
  res.send('Failed');
});
router.get('/success', (req: Request, res: Response) => {
  res.send(`Welcome ${req}`);
});

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/failed',
  }),
  (req, res: Response) => {
    res.redirect('/success');
  },
);

export default router;
