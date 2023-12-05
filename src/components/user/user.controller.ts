/* eslint-disable @typescript-eslint/naming-convention */
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import config from '@config/config';
import logger from '@core/utils/logger';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { IUser } from '@components/user/user.interface';
import { create } from '@components/user/user.service';
import { user } from '@components/user/user.model';
import { design } from '@components/design/design.model';
import { designer } from '@components/designer/designer.model';
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

const updatePassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    // Check if the user exists
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new password and hash it
    const salt = await bcrypt.genSalt(Number(config.salt));
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    existingUser.password = hashPassword;
    await existingUser.save();

    // Send an email notification
    const subject = 'Password Update Notification';
    const mail = `${existingUser.email}`;
    const text = `Your password has been updated.`;

    await sendEmailMiddleware(req, res, mail, subject, text);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find the user by their email
    const userRecord = await user.findOne({ email });

    if (!userRecord) {
      // User not found
      return res.status(201).json({ message: 'Invalid Credentials' });
    }
    const hashedPassword = String(userRecord.password);
    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (passwordMatch) {
      // Passwords match, user is authenticated

      // Clone the user data to avoid modifying the original object directly
      const modifiedUserData = { ...userRecord.toObject() };

      // Omit the password field
      delete modifiedUserData.password;

      // If the user is a designer, find the designerId
      if (modifiedUserData.isDesigner) {
        const designerCheck = await designer.findOne({
          // eslint-disable-next-line no-underscore-dangle
          userId: modifiedUserData._id,
        });
        if (designerCheck) {
          // @ts-ignore
          // eslint-disable-next-line no-underscore-dangle
          modifiedUserData.designerId = designerCheck._id;
        }
      }
      return res
        .status(200)
        .json({ message: 'Success', data: modifiedUserData });
    }

    return res.status(201).json({ message: 'Invalid Credentials' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server Error' });
  }
};
const addAddress = async (req: Request, res: Response) => {
  const {
    address_line1,
    address_line2,
    city,
    state,
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
            state,
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
      state,
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

const followDesigner = async (req: Request, res: Response) => {
  try {
    const { userId, designerId } = req.body;

    // Check if the user and designer exist
    const CheckUser = await user.findById(userId);
    const CheckDesigner = await designer.findById(designerId);

    if (!CheckUser || !CheckDesigner) {
      return res.status(404).json({ message: 'User or designer not found' });
    }

    // Add the designer's ID to the user's following array
    CheckUser.following.push(designerId);
    await CheckUser.save();

    // Add the user's ID to the designer's followers array
    CheckDesigner.followers.push(userId);
    await CheckDesigner.save();

    return res
      .status(200)
      .json({ message: 'User is now following the designer' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// controllers for handling cart operations

// Add a product to the user's cart
const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity, userId } = req.body;

  try {
    // Find the user by ID
    const checkProduct = await design.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Check if the product is already in the cart
    const cartItem = checkUser.cart.find(
      (item) => item.product.toString() === productId.toString(),
    );

    if (cartItem) {
      // Update the quantity if the product is already in the cart
      cartItem.quantity += quantity;
    } else {
      // Add the product to the cart if it's not already there
      checkUser.cart.push({ product: productId, quantity });
    }

    // Save the user with the updated cart
    await checkUser.save();

    return res.status(200).json({ message: 'Product added to cart' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Change the quantity of a product in the user's cart
const changeCartQuantity = async (req: Request, res: Response) => {
  const { productId, quantity, userId } = req.body;

  try {
    // Find the user by ID
    const checkProduct = await design.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Find the cart item corresponding to the product
    const cartItem = checkUser.cart.find(
      (item) => item.product.toString() === productId.toString(),
    );

    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Update the quantity
    cartItem.quantity = quantity;

    // Save the user with the updated cart
    await checkUser.save();

    return res.status(200).json({ message: 'Cart quantity updated' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove an item from the user's cart
const removeFromCart = async (req: Request, res: Response) => {
  const { productId, userId } = req.body;

  try {
    // Find the user by ID
    const checkProduct = await design.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Remove the product from the cart by filtering it out
    const updatedCart = checkUser.cart.filter(
      (item) => item.product.toString() !== productId.toString(),
    );
    checkUser.cart = updatedCart;

    // Save the user with the updated cart
    await checkUser.save();

    return res.status(200).json({ message: 'Product removed from cart' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a controller function to update user fields
const updateUser = async (req: Request, res: Response) => {
  try {
    const { phone, name, description, userId, username } = req.body;

    // Check if the user exists
    const existingUser = await user.findById(userId);

    if (!existingUser) {
      return res.status(201).json({ message: 'User not found' });
    }

    // Update user fields if they are provided in the request body
    if (phone) {
      existingUser.phone = phone;
    }
    if (name) {
      existingUser.name = name;
    }
    if (description) {
      existingUser.description = description;
    }
    if (username) {
      existingUser.username = username;
    }

    // Save the updated user
    await existingUser.save();

    return res
      .status(200)
      .json({ message: 'User updated successfully', user: existingUser });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createUser,
  loginUser,
  addAddress,
  followDesigner,
  addToCart,
  removeFromCart,
  changeCartQuantity,
  updatePassword,
  updateUser,
};
