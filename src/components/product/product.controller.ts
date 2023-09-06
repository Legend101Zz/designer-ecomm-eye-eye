import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { create, read } from '@components/product/product.service';
import { product } from '@components/product/product.model';
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

const changeQuan = async (req: Request, res: Response) => {
  try {
    const prod = req.body.productId;
    const data: any = await read(prod);
    data.quantity = req.body.quantity;
    await data.save();
    return res.status(200).send({ message: 'success', data });
  } catch (err) {
    logger.error(err);
    return res.status(501).send({ message: 'server error ' });
  }
};

const addColor = async (req: Request, res: Response) => {
  const { color, productId } = req.body;

  try {
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $addToSet: { color } }, // Add color to the array if it doesn't exist
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteColor = async (req: Request, res: Response) => {
  const { color, productId } = req.body;

  try {
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $pull: { color } }, // Remove the specified color from the array
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createProd, readProd, changeQuan, addColor, deleteColor };
