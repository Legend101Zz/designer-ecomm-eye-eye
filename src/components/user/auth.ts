import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import config from '@config/config';
// import { NextFunction, Request, Response } from 'express';

const googleStrategy = new GoogleStrategy(
  {
    clientID: config.googleClient,
    clientSecret: config.googleClientSecret,
    callbackURL: 'http://localhost:8080/auth/google/callback',
    passReqToCallback: true,
  },
  (request, accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  },
);

// Initializing Passport
passport.use(googleStrategy);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
