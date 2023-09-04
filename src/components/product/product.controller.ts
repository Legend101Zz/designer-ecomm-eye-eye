import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { create, read } from '@components/product/product.service';
import { Iproduct } from './product.interface';

const createProd = async (req: Request, res: Response) => {
  const prod = req.body as Iproduct;
  await create(prod);
  res.status(httpStatus.CREATED);
  return res.send({ message: 'Created' });
};

const readProd = async (req: Request, res: Response) => {
  try {
    const prod = req.params.id;
    const data = await read(prod);

    return res.status(200).send({ message: 'success', data });
  } catch (err) {
    logger.error(err);
    return res.status(501).send({ message: 'server error ' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createProd, readProd };
