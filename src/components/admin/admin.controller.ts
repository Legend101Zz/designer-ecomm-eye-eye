import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import bcrypt from 'bcrypt';
import { admin } from './admin.model';

// creating a admin

const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if an admin with the same email already exists
    const existingAdmin = await admin.findOne({ email });

    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: 'Admin with this email already exists' });
    }

    // Hash the password before saving it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // eslint-disable-next-line new-cap
    const newAdmin = new admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    return res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while creating the admin' });
  }
};

// login admin

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin by email
    const foundAdmin = await admin.findOne({ email });

    if (!foundAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, foundAdmin.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    return res.status(200).json({ message: 'Admin logged in successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while logging in' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createAdmin, loginAdmin };
