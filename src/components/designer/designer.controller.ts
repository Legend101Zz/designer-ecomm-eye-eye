import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { designer } from '@components/designer/designer.model';
import { user } from '@components/user/user.model';
import { product } from '@components/product/product.model';
import { IUser } from '@components/user/user.interface';
import { IDesigner } from './designer.interface';

const requestDesigner = async (req: Request, res: Response) => {
  const { userId } = req.body.userId;
  try {
    const checkUser: IUser = await user.findById(userId);
    if (checkUser.isDesigner) {
      return res
        .status(201)
        .send({ message: 'User is already a registered Designer ' });
    }
    // eslint-disable-next-line new-cap
    const newDesigner = new designer({ userId });
    await newDesigner.save();
    return res.status(200).send({ message: 'Request sent' });
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error' });
  }
};

const createProduct = async (req: Request, res: Response) => {
  const { designerId } = req.body.userId;

  try {
    const checkUser: IDesigner = await designer.findById(designerId);
    if (checkUser.isApproved) {
      return res
        .status(201)
        .send({ message: 'User is already a registered Designer ' });
    }
    // eslint-disable-next-line new-cap
    const newDesigner = new designer({ userId });
    await newDesigner.save();
    return res.status(201).send({ message: 'Designer n' });
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { requestDesigner };
