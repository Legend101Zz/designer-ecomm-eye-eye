import { NextFunction, Response } from 'express';

const isLoggedIn = (req: any, res: Response, next: NextFunction) => {
  console.log(req.user);
  if (req.user) {
    next();
  } else {
    res.status(401).send('You must login first');
  }
};

// eslint-disable-next-line import/prefer-default-export
export { isLoggedIn };
