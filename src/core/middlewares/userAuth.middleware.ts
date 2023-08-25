import { NextFunction, Response } from 'express';

const isLoggedIn = (req: any, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};

// eslint-disable-next-line import/prefer-default-export
export { isLoggedIn };
