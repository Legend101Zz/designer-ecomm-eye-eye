import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { user } from '@components/user/user.model';
import { address } from '@components/user/userAddress.model';
import { Transactions } from './transcations.model';

const createTransaction = async (req: Request, res: Response) => {
  const { userId, products, address: addressId } = req.body;

  try {
    const checkUser = await user.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checkAddress = await address.findById(addressId);
    if (!checkAddress) {
      return res.status(404).json({ message: 'Invalid Address' });
    }

    const order = new Transactions({
      user: userId,
      DeliveryAddress: addressId,
      productsBought: products,
    });

    await order.save();

    return res
      .status(201)
      .json({ message: 'Transaction initiated', orderId: order._id });
  } catch (err) {
    logger.error('Transaction creation failed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTransaction = async (req: Request, res: Response) => {
  const { transactionId, razorpayPaymentId, razorpaySignature, status } =
    req.body;

  try {
    const transaction = await Transactions.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.razorpay_payment_id = razorpayPaymentId;
    transaction.razorpay_signature = razorpaySignature;
    transaction.status = status;

    await transaction.save();

    return res
      .status(200)
      .json({ message: 'Transaction updated', transaction });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createTransaction, updateTransaction };
