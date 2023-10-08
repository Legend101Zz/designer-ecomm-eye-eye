import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { user } from '@components/user/user.model';
import { address } from '@components/user/userAddress.model';
import { transcations } from './transcations.model';

const createTransaction = async (req: Request, res: Response) => {
  const { userId, products, Address } = req.body;

  try {
    const checkUser = await user.findById(userId);
    if (checkUser) {
      const checkAddress = await address.findById(Address);
      if (checkAddress) {
        // eslint-disable-next-line new-cap
        const order = new transcations({
          user: userId,
          DeliveryAddress: Address,
          productsBought: products,
        });
        await order.save();
        return res.status(201).json({ message: 'Transaction Initiated' });
      }
      return res.status(201).json({ message: 'Invalid Address' });
    }
    return res.status(201).json({ message: 'User not found' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createTransaction };
