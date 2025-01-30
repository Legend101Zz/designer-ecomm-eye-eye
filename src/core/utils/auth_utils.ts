import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

export const signJwt = (payload: any): string => {
  return jwt.sign(payload, secret, { expiresIn: '1d', algorithm: 'HS256' });
};

export const verifyJwt = (
  token: string,
  callback: (err, decoded) => any,
): any => {
  return jwt.verify(token, secret, callback);
};

export const decodeJwt = (token: string): any => {
  return jwt.decode(token);
};

export const checkIsDesigner = (user: any) => {
  return user.isDesigner;
};
