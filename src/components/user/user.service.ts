import httpStatus from 'http-status';
import AppError from '@core/utils/appError';
import logger from '@core/utils/logger';
import { user } from '@components/user/user.model';
import { IUser } from '@components/user/user.interface';

const create = async (newUser: IUser): Promise<boolean> => {
  try {
    const createUser = await user.create(newUser);
    logger.debug(`User created: %O`, createUser);
    return true;
  } catch (err) {
    logger.error(`User create err: %O`, err.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'User was not created!');
  }
};

const read = async (id: string): Promise<IUser> => {
  logger.debug(`Sent user.id ${id}`);
  const readUser = await user.findOne({ _id: id });
  return readUser as IUser;
};

const update = async (updateUser: IUser): Promise<boolean> => {
  try {
    const updatedUser = await user.findOneAndUpdate(
      { email: updateUser.username },
      { password: updateUser.password },
      { new: true },
    );
    logger.debug(`User updated: %O`, updatedUser);
    return true;
  } catch (err) {
    logger.error(`User update err: %O`, err.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'User was not updated!');
  }
};

const deleteById = async (id: string): Promise<boolean> => {
  await user.findByIdAndDelete(id);
  logger.debug(`User ${id} has been removed`);
  return true;
};

export { create, read, update, deleteById };
