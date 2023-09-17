/* eslint-disable @typescript-eslint/naming-convention */
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import config from '@config/config';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { IUser } from '@components/user/user.interface';
import { create } from '@components/user/user.service';
import { user } from '@components/user/user.model';
import { address } from './userAddress.model';

function generateRandomPassword(length = 8) {
  // Define character sets for different types of characters
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numericChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Combine character sets based on your requirements
  const allChars =
    lowercaseChars + uppercaseChars + numericChars + specialChars;

  let password = '';

  // Generate the password
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }

  return password;
}

const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = req.body as IUser;
    const subject = 'Welcome to EYE-EYE-TEE';
    const password = generateRandomPassword();
    const mail = `${newUser.email}`;
    const text = `Your credentials are :- \n username : ${newUser.username} \n password: ${password}`;
    const salt = await bcrypt.genSalt(Number(config.salt));
    const hashPassword = await bcrypt.hash(password, salt);
    const check = await user.find({ email: newUser.email });
    // console.log(check, 'here');
    if (check.length === 0 || !check) {
      newUser.password = hashPassword;
      await create(newUser);
      res.status(httpStatus.CREATED);
      return sendEmailMiddleware(req, res, mail, subject, text);
    }
    return res.status(201).send({ message: 'User already exists' });
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error' });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const newUser = req.body as IUser;
    const check: any = await user.find({ email: newUser.email });
    // console.log(check[0].password, newUser.password, 'here');
    if (check[0].password === newUser.password) {
      return res.status(201).send({ message: 'success', data: check });
    }
    return res.status(201).send({ message: 'Invalid Credentials' });
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error' });
  }
};

const addAddress = async (req: Request, res: Response) => {
  const {
    address_line1,
    address_line2,
    city,
    postal_code,
    country,
    address_type,
    user_id,
  } = req.body;
  try {
    const duplicateAddresses = await address.aggregate([
      {
        $group: {
          _id: {
            address_line1,
            address_line2,
            city,
            postal_code,
            country,
            address_type,
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    if (duplicateAddresses.length > 0) {
      return res.status(201).json({
        message: 'Duplicate addresses found',
        duplicates: duplicateAddresses,
      });
    }
    const userCheck = await user.findById(user_id);
    // eslint-disable-next-line new-cap
    const newAddress = new address({
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      address_type,
      user_id,
    });

    userCheck.addresses.push(
      // eslint-disable-next-line no-underscore-dangle
      newAddress._id as unknown as mongoose.Schema.Types.ObjectId,
    );
    await userCheck.save();
    await newAddress.save();
    return res.status(200).json({ message: 'Address added successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'An error occurred while checking for duplicates',
      error,
    });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createUser, loginUser, addAddress };
