import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import config from '@config/config';
import logger from '@core/utils/logger';
import { user } from './user.model';

// import { NextFunction, Request, Response } from 'express';

const googleStrategy = new GoogleStrategy(
  {
    clientID: config.googleClient,
    clientSecret: config.googleClientSecret,
    callbackURL: 'http://localhost:8080/api/auth/google/callback',
    scope: ['profile', 'email'],
    passReqToCallback: true,
  },
  async (request, accessToken, refreshToken, profile, cb) => {
    const defaultUser = {
      username: `${profile.name.givenName} ${profile.name.familyName}`,
      email: profile.emails[0].value,
      googleId: profile.id,
    };
    const checkUser: any = await user
      .findOne({ googleId: profile.id })
      .catch((err) => {
        logger.error(`Sign Up error ${err}`);
        cb(err, null);
      });

    if (checkUser) {
      cb(null, checkUser);
    } else {
      await user
        .create(defaultUser)
        .then((result) => {
          cb(null, result);
        })
        .catch((err) => {
          logger.error(`Sign Up error ${err}`);
          cb(err, null);
        });
    }
  },
);

// Initializing Passport
passport.use(googleStrategy);

passport.serializeUser((User: any, cb) => {
  console.log('serialising User', User);
  // eslint-disable-next-line no-underscore-dangle
  cb(null, User._id);
});

passport.deserializeUser(async (id, cb) => {
  const checkuser = await user.findOne(id).catch((err) => {
    logger.error(`Error Deserialising ${err}`);
    cb(err, null);
  });
  if (checkuser) cb(null, id);
});
