import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { user } from '@components/user/user.model';
import { address } from '@components/user/userAddress.model';
import RazorpayService, {
  RazorpayOrderData,
  PaymentVerificationData,
} from '@core/services/razorpay.service';
import { transcations } from './transcations.model';
import { PaymentProvider, TransactionStatus } from './transcations.interface';

const createTransaction = async (req: Request, res: Response) => {
  const { products, Address, paymentProvider, amount, currency } = req.body;
  const userId = (req as any).user?.userId;
  console.log('address', req.body.Address, Address);

  try {
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const checkUser = await user.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checkAddress = await address.findById(Address);
    if (!checkAddress) {
      return res.status(400).json({ message: 'Invalid Address' });
    }

    // Generate unique transaction ID
    const transactionId = `TXN_${Date.now()}_${userId.slice(-6)}`;

    // Create transaction record first
    const transaction = new transcations({
      transaction_id: transactionId,
      user: userId,
      DeliveryAddress: Address,
      productsBought: products,
      paymentProvider,
      amount,
      currency: currency || 'INR',
      status: TransactionStatus.PENDING,
    });

    await transaction.save();

    // If payment provider is Razorpay, create Razorpay order
    if (paymentProvider === PaymentProvider.RAZORPAY) {
      try {
        const razorpayOrderData: RazorpayOrderData = {
          amount: amount * 100, // Convert to paise (smallest currency unit)
          currency: currency || 'INR',
          receipt: transactionId,
          notes: {
            transactionId: transaction._id,
            userId,
            userEmail: checkUser.email,
            userName: checkUser.username,
          },
        };

        const razorpayOrder = await RazorpayService.createOrder(
          razorpayOrderData,
        );

        // Update transaction with Razorpay order details
        transaction.paymentDetails = {
          ...transaction.paymentDetails,
          paymentIntentId: razorpayOrder.id,
        };
        await transaction.save();

        return res.status(201).json({
          message: 'Transaction initiated successfully',
          transaction: {
            id: transaction._id,
            transaction_id: transactionId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
          },
          razorpay: {
            order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
          },
          user: {
            name: checkUser.name || checkUser.username,
            email: checkUser.email,
            phone: checkUser.phone,
          },
        });
      } catch (razorpayError) {
        logger.error('Razorpay order creation failed:', razorpayError);

        // Update transaction status to failed
        transaction.status = TransactionStatus.FAILED;
        await transaction.save();

        return res.status(500).json({
          message: 'Payment gateway error. Please try again.',
          transaction: {
            id: transaction._id,
            status: TransactionStatus.FAILED,
          },
        });
      }
    }

    // For other payment providers or cash on delivery
    return res.status(201).json({
      message: 'Transaction initiated successfully',
      transaction: {
        id: transaction._id,
        transaction_id: transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
      },
    });
  } catch (err) {
    logger.error('Transaction creation error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const paymentData: PaymentVerificationData = req.body;

    // Find the transaction
    const transaction = await transcations.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify payment signature
    const isValidSignature =
      RazorpayService.verifyPaymentSignature(paymentData);

    if (!isValidSignature) {
      logger.warn('Invalid payment signature:', { transactionId, paymentData });

      transaction.status = TransactionStatus.FAILED;
      await transaction.save();

      return res.status(400).json({
        message: 'Payment verification failed',
        status: 'failed',
      });
    }

    // Get payment details from Razorpay
    try {
      const paymentDetails = await RazorpayService.getPayment(
        paymentData.razorpay_payment_id,
      );

      // Update transaction with payment details
      transaction.status = TransactionStatus.COMPLETED;
      transaction.isCompleted = true;
      transaction.paymentDetails = {
        ...transaction.paymentDetails,
        paymentIntentId: paymentData.razorpay_order_id,
        paymentMethodId: paymentData.razorpay_payment_id,
        receiptUrl: paymentDetails.receipt || '',
      };

      await transaction.save();

      logger.info('Payment verified successfully:', {
        transactionId,
        paymentId: paymentData.razorpay_payment_id,
        orderId: paymentData.razorpay_order_id,
      });

      return res.status(200).json({
        message: 'Payment verified successfully',
        status: 'success',
        transaction: {
          id: transaction._id,
          transaction_id: transaction.transaction_id,
          status: transaction.status,
          isCompleted: transaction.isCompleted,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentId: paymentData.razorpay_payment_id,
        },
      });
    } catch (error) {
      logger.error('Error fetching payment details:', error);

      // Still mark as completed if signature is valid
      transaction.status = TransactionStatus.COMPLETED;
      transaction.isCompleted = true;
      transaction.paymentDetails = {
        ...transaction.paymentDetails,
        paymentIntentId: paymentData.razorpay_order_id,
        paymentMethodId: paymentData.razorpay_payment_id,
      };
      await transaction.save();

      return res.status(200).json({
        message: 'Payment verified successfully',
        status: 'success',
        transaction: {
          id: transaction._id,
          status: transaction.status,
          isCompleted: transaction.isCompleted,
        },
      });
    }
  } catch (err) {
    logger.error('Payment verification error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const handlePaymentCaptured = async (payment: any) => {
  try {
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Find transaction by Razorpay order ID
    const transaction = await transcations.findOne({
      'paymentDetails.paymentIntentId': orderId,
    });

    if (transaction) {
      transaction.status = TransactionStatus.COMPLETED;
      transaction.isCompleted = true;
      transaction.paymentDetails = {
        ...transaction.paymentDetails,
        paymentMethodId: paymentId,
      };

      await transaction.save();

      logger.info('Payment captured via webhook:', {
        transactionId: transaction._id,
        orderId,
        paymentId,
      });
    }
  } catch (error) {
    logger.error('Error handling payment captured:', error);
  }
};

const handlePaymentFailed = async (payment: any) => {
  try {
    const orderId = payment.order_id;

    const transaction = await transcations.findOne({
      'paymentDetails.paymentIntentId': orderId,
    });

    if (transaction) {
      transaction.status = TransactionStatus.FAILED;
      await transaction.save();

      logger.info('Payment failed via webhook:', {
        transactionId: transaction._id,
        orderId,
      });
    }
  } catch (error) {
    logger.error('Error handling payment failed:', error);
  }
};

const handleOrderPaid = async (order: any) => {
  try {
    const orderId = order.id;

    const transaction = await transcations.findOne({
      'paymentDetails.paymentIntentId': orderId,
    });

    if (transaction && transaction.status !== TransactionStatus.COMPLETED) {
      transaction.status = TransactionStatus.COMPLETED;
      transaction.isCompleted = true;
      await transaction.save();

      logger.info('Order paid via webhook:', {
        transactionId: transaction._id,
        orderId,
      });
    }
  } catch (error) {
    logger.error('Error handling order paid:', error);
  }
};

const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const body = JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    // Verify webhook signature
    const isValidSignature = RazorpayService.verifyWebhookSignature(
      body,
      signature,
    );

    if (!isValidSignature) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { event, payload } = req.body;

    logger.info('Razorpay webhook received:', {
      event,
      orderId: payload.payment?.entity?.order_id,
    });

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(payload.order.entity);
        break;

      default:
        logger.info('Unhandled webhook event:', event);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    logger.error('Webhook handling error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const {
      status,
      paymentProvider,
      isCompleted,
      amount,
      currency,
      paymentDetails,
    } = req.body;

    // Find the transaction
    const transaction = await transcations.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update fields if provided
    if (status) {
      transaction.status = status;
    }

    if (paymentProvider) {
      transaction.paymentProvider = paymentProvider;
    }

    if (typeof isCompleted === 'boolean') {
      transaction.isCompleted = isCompleted;

      // If marking as completed, update status if not already set
      if (isCompleted && transaction.status === TransactionStatus.PENDING) {
        transaction.status = TransactionStatus.COMPLETED;
      }
    }

    if (amount !== undefined) {
      transaction.amount = amount;
    }

    if (currency) {
      transaction.currency = currency;
    }

    if (paymentDetails) {
      transaction.paymentDetails = {
        ...transaction.paymentDetails,
        ...paymentDetails,
      };
    }

    // Save the updated transaction
    await transaction.save();

    return res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: {
        id: transaction._id,
        transaction_id: transaction.transaction_id,
        status: transaction.status,
        isCompleted: transaction.isCompleted,
        paymentProvider: transaction.paymentProvider,
        amount: transaction.amount,
        currency: transaction.currency,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (err) {
    logger.error('Update transaction error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await transcations
      .findById(transactionId)
      .populate('user', 'username email')
      .populate('DeliveryAddress')
      .populate('productsBought.product');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.status(200).json({ transaction });
  } catch (err) {
    logger.error('Get transaction error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, page = 1 } = req.query;

    const filter: any = { user: userId };
    if (status) {
      filter.status = status;
    }

    const transactions = await transcations
      .find(filter)
      .populate('DeliveryAddress')
      .populate('productsBought.product')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await transcations.countDocuments(filter);

    return res.status(200).json({
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    logger.error('Get user transactions error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export {
  createTransaction,
  updateTransaction,
  getTransaction,
  getUserTransactions,
  verifyPayment,
  handleWebhook,
};
