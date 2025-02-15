import { verifyJwt } from '@core/utils/auth_utils';
import { NextFunction, Response } from 'express';
import { middleware } from 'express-http-context';
import jwt from 'jsonwebtoken';

export type JWTUserPayload = {
  userId: string;
  role: string;
  designerId: string | undefined;
};

const isLoggedIn = (req: any, res: Response, next: NextFunction) => {
  if (req.session.userData) {
    next();
  } else {
    res.status(401).send('You must login first');
  }
};

// middleware.authenticateUser
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  let error;

  verifyJwt(token, (err, decoded: JWTUserPayload) => {
    if (err) {
      error = err;
    }

    req.user = decoded; // Attach the decoded token (user ID and role) to the request
  });
  if (error) {
    return res.status(403).json({ message: 'Unauthorized: Invalid token' });
  }
  next();
}

const authorizeRole = (authRole: string) => {
  return (req: any, res: Response, next: NextFunction) => {
    const token: string = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    verifyJwt(token, (err, decoded: JWTUserPayload) => {
      if (err) {
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
      }
      req.user = decoded;
      const { role } = req.user;
      if (role !== authRole) {
        res.status(403).json({ message: 'Unauthorized: Invalid role' });
      }
      next();
    });
  };
};

export { isLoggedIn, authenticate, authorizeRole };
