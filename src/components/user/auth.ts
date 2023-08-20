import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import config from '@config/config';
import { NextFunction, Request, Response } from 'express';

const googleStrategy = new GoogleStrategy(
  {
    clientID: config.googleClient,
    clientSecret: config.googleClientSecret,
    callbackURL: 'http://localhost:8080/auth/google/callback',
    passReqToCallback: true,
  },
  (request, accessToken, refreshToken, profile, done) => {
    const user = {
      profile,
      accessToken,
    };
    return done(null, user);
  },
);

// Initializing Passport
passport.use(googleStrategy);

// Create an authentication middleware function
export default function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate('google', { scope: ['profile', 'email'] })(
    req,
    res,
    next,
  );
}
