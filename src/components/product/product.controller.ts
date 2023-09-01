import { Request, Response } from 'express';
import httpStatus from 'http-status';
import {
  create,
  read,
  update,
  deleteById,
} from '@components/product/product.service';
import { Iproduct } from './product.interface';

const createProd = async (req: Request, res: Response) => {
  const prod = req.body as Iproduct;
  await create(prod);
  res.status(httpStatus.CREATED);
  return res.send({ message: 'Created' });
};

// eslint-disable-next-line import/prefer-default-export
export { createProd };
