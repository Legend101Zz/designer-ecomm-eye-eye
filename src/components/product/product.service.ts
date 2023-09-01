import httpStatus from 'http-status';
import AppError from '@core/utils/appError';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { Iproduct } from './product.interface';

const create = async (prod: Iproduct): Promise<boolean> => {
  try {
    const newProduct = await product.create(prod);
    logger.debug(`Product added: %O`, newProduct);
    return true;
  } catch (err) {
    logger.error(`Product create err: %O`, err.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'Product was not added!');
  }
};

const read = async (id: string): Promise<Iproduct> => {
  logger.debug(`Sent user.id ${id}`);
  const user = await product.findOne({ _id: id });
  return user as Iproduct;
};

const update = async (prod: Iproduct): Promise<boolean> => {
  try {
    const updatedProd = await product.findOneAndUpdate(
      {
        quantity: prod.quantity,
        name: prod.name,
        color: prod.color,
        category: prod.category,
      },
      { new: true },
    );
    logger.debug(`Product updated: %O`, updatedProd);
    return true;
  } catch (err) {
    logger.error(`Product update err: %O`, err.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'Product was not updated!');
  }
};

const deleteById = async (id: string): Promise<boolean> => {
  await product.findByIdAndDelete(id);
  logger.debug(`Product ${id} has been removed`);
  return true;
};

export { create, read, update, deleteById };
