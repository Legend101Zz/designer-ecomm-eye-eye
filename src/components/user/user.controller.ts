import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { IUser } from '@components/user/user.interface';
import { create } from '@components/user/user.service';
import { user } from '@components/user/user.model';

const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = req.body as IUser;
    const check = await user.find({ email: newUser.email });
    console.log(check, 'here');
    if (check.length === 0 || !check) {
      await create(newUser);
      res.status(httpStatus.CREATED);
      return res.send({ message: 'Created' });
    }
    return res.status(201).send({ message: 'User already exists' });
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createUser };
