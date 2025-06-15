/* eslint-disable @typescript-eslint/naming-convention */
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import config from '@config/config';
import { signJwt } from '@core/utils/auth_utils';
import logger from '@core/utils/logger';
import { JWTUserPayload } from '@core/middlewares/userAuth.middleware';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { IUser } from '@components/user/user.interface';
import { create } from '@components/user/user.service';
import { user } from '@components/user/user.model';
import { designer } from '@components/designer/designer.model';
import { finalProduct } from '@components/finalProduct/finalprod.model';
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

// Password validation helper
const isValidPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = req.body as IUser;
    const password = generateRandomPassword();
    const mail = `${newUser.email}`;
    console.log(password);
    // HTML Email Template
    const subject = 'Welcome to Deauth - Your Fashion Journey Begins';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #292929;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #292929;
          color: white;
          text-align: center;
          padding: 40px 20px;
        }
        .logo {
          width: 180px;
          height: auto;
          margin-bottom: 20px;
        }
        .welcome-text {
          font-size: 28px;
          font-weight: bold;
          margin: 20px 0;
          color: #ffffff;
        }
        .content {
          padding: 40px;
        }
        .hero-message {
          text-align: center;
          margin-bottom: 30px;
          font-size: 18px;
          color: #292929;
        }
        .credentials-box {
          background-color: #fff9f0;
          border: 2px solid #ff7d04;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .credentials-box h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
          font-size: 20px;
        }
        .credentials-item {
          padding: 12px;
          background: #ffffff;
          margin: 8px 0;
          border-radius: 4px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .login-button {
          display: inline-block;
          padding: 15px 40px;
          background-color: #ff7d04;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .security-notice {
          background-color: #292929;
          color: #ffffff;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .security-notice h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
        }
        .security-notice ol {
          margin: 0;
          padding-left: 20px;
        }
        .security-notice li {
          margin: 10px 0;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .feature {
          text-align: center;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .feature h4 {
          color: #ff7d04;
          margin: 10px 0;
        }
        .footer {
          background-color: #292929;
          color: #ffffff;
          text-align: center;
          padding: 30px;
          font-size: 12px;
        }
        .footer a {
          color: #ff7d04;
          text-decoration: none;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.deauth.in/_next/image?url=%2FDeauth-Logo.png&w=256&q=75" alt="Deauth Logo" class="logo">
          <div class="welcome-text">Welcome to Your Fashion Journey</div>
        </div>
        
        <div class="content">
          <div class="hero-message">
            Get ready to explore exclusive designer collections and express your unique style.
          </div>
          
          <div class="credentials-box">
            <h3>Your Account Details</h3>
            <div class="credentials-item">
              <strong>Email:</strong> ${mail}
            </div>
            <div class="credentials-item">
              <strong>Username:</strong> ${newUser.username}
            </div>
            <div class="credentials-item">
              <strong>Password:</strong> ${password}
            </div>
          </div>
    
          <div class="button-container">
            <a href="https://deauth.in/login" class="login-button">Start Shopping</a>
          </div>
    
          <div class="security-notice">
            <h3>Important Security Steps</h3>
            <ol>
              <li>Log in using your credentials</li>
              <li>Change your password immediately</li>
              <li>Keep your account information secure</li>
            </ol>
          </div>
    
          <div class="features">
            <div class="feature">
              <h4>Exclusive Designs</h4>
              <p>Discover unique pieces from talented designers</p>
            </div>
            <div class="feature">
              <h4>Premium Quality</h4>
              <p>Experience fashion that stands out</p>
            </div>
          </div>
        </div>
    
        <div class="footer">
          <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
          <div>
            <a href="https://deauth.in/privacy">Privacy Policy</a> | 
            <a href="https://deauth.in/terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Plain text version as fallback
    const textContent = `
Welcome to Deauth!

Hello ${newUser.username},

Thank you for creating an account with Deauth. We're excited to have you join our community!

Your Login Credentials:
Mail : ${mail}
Username: ${newUser.username}
Password: ${password}

Important Security Notice:
1. Log in to your account using the credentials above
2. Change your password immediately after logging in
3. Keep your login information secure and never share it with others

Login at: https://deauth.in/login

This is an automated message, please do not reply to this email.

© ${new Date().getFullYear()} DeAuth. All rights reserved.
`;

    const salt = await bcrypt.genSalt(Number(config.salt));
    const hashPassword = await bcrypt.hash(password, salt);
    const check = await user.find({ email: newUser.email });
    if (check.length === 0) {
      newUser.password = hashPassword;
      newUser.isVerified = false;

      const emailSent = await sendEmailMiddleware(
        req,
        res,
        mail,
        subject,
        htmlContent,
        textContent,
      );

      if (!emailSent) {
        return res
          .status(500)
          .send({ message: 'Error sending verification email' });
      }

      await create(newUser);
      return res.status(httpStatus.CREATED).send({
        message:
          'User created successfully. Please check your email for login credentials.',
      });
    }

    return res.status(400).send({ message: 'User already exists' });
  } catch (err) {
    logger.error(err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Server Error',
    });
  }
};

const handleGoogleAuth = async (req: Request, res: Response) => {
  try {
    const { email, username, name, googleId, image } = req.body;
    const password = generateRandomPassword(); // Your existing password generator

    // Check if user exists
    const existingUser = await user.findOne({ email });

    if (existingUser) {
      // User exists, update Google-specific fields if needed
      const userId = existingUser.id;
      const designerId = existingUser.DesignerId;
      existingUser.googleId = googleId;
      await existingUser.save();

      const token: string = signJwt({
        userId,
        role: existingUser.isDesigner ? 'designer' : 'user',
        designerId,
      });

      return res.status(200).json({
        success: true,
        // eslint-disable-next-line no-underscore-dangle
        userId: existingUser._id,
        isDesigner: existingUser.isDesigner,
        designerId: existingUser.DesignerId,
        token,
      });
    }

    // Create new user
    const salt = await bcrypt.genSalt(Number(config.salt));
    const hashPassword = await bcrypt.hash(password, salt);

    // eslint-disable-next-line new-cap
    const newUser = new user({
      email,
      username,
      name,
      password: hashPassword,
      googleId,
      image,
      isVerified: true, // Google users are verified by default
    });

    await newUser.save();

    // Email Template
    const subject = 'Welcome to Deauth - Your Account Details';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #292929;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #292929;
          color: white;
          text-align: center;
          padding: 40px 20px;
        }
        .logo {
          width: 180px;
          height: auto;
          margin-bottom: 20px;
        }
        .welcome-text {
          font-size: 28px;
          font-weight: bold;
          margin: 20px 0;
          color: #ffffff;
        }
        .content {
          padding: 40px;
        }
        .credentials-box {
          background-color: #fff9f0;
          border: 2px solid #ff7d04;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .credentials-item {
          padding: 12px;
          background: #ffffff;
          margin: 8px 0;
          border-radius: 4px;
        }
        .notice-box {
          background-color: #292929;
          color: #ffffff;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .notice-box h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
        }
        .button {
          display: inline-block;
          padding: 15px 40px;
          background-color: #ff7d04;
          color: #ffffff;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
        }
        .footer {
          background-color: #292929;
          color: #ffffff;
          text-align: center;
          padding: 30px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.deauth.in/_next/image?url=%2FDeauth-Logo.png&w=256&q=75" alt="Deauth Logo" class="logo">
          <div class="welcome-text">Welcome to Deauth</div>
        </div>
        
        <div class="content">
          <p>Hi ${name || username},</p>
          
          <p>Your account has been successfully created using Google Sign-In!</p>
          
          <div class="credentials-box">
            <h3>Your Account Details</h3>
            <div class="credentials-item">
              <strong>Email:</strong> ${email}
            </div>
            <div class="credentials-item">
              <strong>Password:</strong> ${password}
            </div>
          </div>

          <div class="notice-box">
            <h3>Important Information</h3>
            <p>You can continue using Google Sign-In for quick access to your account.</p>
            <p>If you prefer, you can also use the password provided above to log in directly.</p>
            <p>We recommend changing this password after your first login for security purposes.</p>
          </div>

          <p style="text-align: center;">
            <a href="https://deauth.in/auth/login" class="button">Login to Your Account</a>
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
          <p>
            <a href="https://deauth.in/privacy" style="color: #ff7d04; margin: 0 10px;">Privacy Policy</a> | 
            <a href="https://deauth.in/terms" style="color: #ff7d04; margin: 0 10px;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const textContent = `
Welcome to Deauth!

Hi ${name || username},

Your account has been successfully created using Google Sign-In!

Your Account Details:
Email: ${email}
Password: ${password}

Important Information:
- You can continue using Google Sign-In for quick access
- You can also use the password provided above to log in directly
- We recommend changing this password after your first login

Login at: https://deauth.in/auth/login

© ${new Date().getFullYear()} Deauth. All rights reserved.
`;

    await sendEmailMiddleware(
      req,
      res,
      email,
      subject,
      htmlContent,
      textContent,
    );

    return res.status(200).json({
      success: true,
      // eslint-disable-next-line no-underscore-dangle
      userId: newUser._id,
      isDesigner: newUser.isDesigner,
      designerId: newUser.DesignerId,
    });
  } catch (err) {
    logger.error('Google auth error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

const updatePassword = async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    // Validate password requirements
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
      });
    }

    // Check if the user exists
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      existingUser.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(Number(config.salt));
    const hashPassword = await bcrypt.hash(newPassword, salt);
    existingUser.password = hashPassword;
    await existingUser.save();

    // Send email notification with HTML template

    const mail = existingUser.email;
    const subject = 'Password Updated Successfully - Deauth';
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <style>
       body {
         font-family: Arial, sans-serif;
         line-height: 1.6;
         color: #292929;
         background-color: #f5f5f5;
         margin: 0;
         padding: 0;
       }
       .container {
         max-width: 600px;
         margin: 0 auto;
         background-color: #ffffff;
       }
       .header {
         background-color: #292929;
         color: white;
         text-align: center;
         padding: 40px 20px;
       }
       .logo {
         width: 180px;
         height: auto;
         margin-bottom: 20px;
       }
       .title {
         font-size: 28px;
         font-weight: bold;
         margin: 20px 0;
         color: #ffffff;
       }
       .content {
         padding: 40px;
       }
       .alert-box {
         background-color: #fff9f0;
         border: 2px solid #ff7d04;
         border-radius: 8px;
         padding: 25px;
         margin: 25px 0;
         text-align: center;
       }
       .alert-box h3 {
         color: #ff7d04;
         margin: 0 0 15px 0;
         font-size: 20px;
       }
       .success-icon {
         font-size: 48px;
         margin-bottom: 15px;
       }
       .security-tips {
         background-color: #292929;
         color: #ffffff;
         padding: 25px;
         border-radius: 8px;
         margin: 25px 0;
       }
       .security-tips h3 {
         color: #ff7d04;
         margin: 0 0 15px 0;
       }
       .tips-list {
         list-style: none;
         padding: 0;
         margin: 0;
       }
       .tips-list li {
         margin: 15px 0;
         padding-left: 25px;
         position: relative;
       }
       .tips-list li:before {
         content: "•";
         color: #ff7d04;
         font-size: 20px;
         position: absolute;
         left: 0;
       }
       .warning-box {
         background-color: #fff9f0;
         border-left: 4px solid #ff7d04;
         padding: 20px;
         margin: 25px 0;
         border-radius: 0 8px 8px 0;
       }
       .warning-box p {
         margin: 0;
       }
       .warning-box a {
         color: #ff7d04;
         text-decoration: none;
         font-weight: bold;
       }
       .footer {
         background-color: #292929;
         color: #ffffff;
         text-align: center;
         padding: 30px;
         font-size: 12px;
       }
       .footer a {
         color: #ff7d04;
         text-decoration: none;
         margin: 0 10px;
       }
     </style>
    </head>
    <body>
     <div class="container">
       <div class="header">
         <img src="https://www.deauth.in/_next/image?url=%2FDeauth-Logo.png&w=256&q=75" alt="Deauth Logo" class="logo">
         <div class="title">Password Updated</div>
       </div>
       
       <div class="content">
         <p>Hello ${existingUser.username},</p>
         
         <div class="alert-box">
           <div class="success-icon">✓</div>
           <h3>Password Successfully Updated</h3>
           <p>Your account password was changed on ${new Date().toLocaleString()}</p>
         </div>
         
         <div class="security-tips">
           <h3>Keep Your Account Secure</h3>
           <ul class="tips-list">
             <li>Use a unique password for your Deauth account</li>
             <li>Never share your password with anyone</li>
             <li>Avoid using easily guessable information</li>
             <li>Log out when using shared devices</li>
           </ul>
         </div>
    
         <div class="warning-box">
           <p> Didn't make this change? Please contact our support team immediately at 
              <a href="mailto:support@deauth.in">support@deauth.in</a>
            </p>
         </div>
       </div>
    
       <div class="footer">
         <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
         <div>
           <a href="https://deauth.in/privacy">Privacy Policy</a> | 
           <a href="https://deauth.in/terms">Terms of Service</a>
         </div>
       </div>
     </div>
    </body>
    </html>
    `;

    const textContent = `
    Password Updated Successfully - Deauth
    
    Hello ${existingUser.username},
    
    Your password was successfully changed on ${new Date().toLocaleString()}.
    
    Security Tips:
    - Use a unique password for your Deauth account
    - Never share your password with anyone
    - Avoid using easily guessable information
    - Log out when using shared devices
    
    ⚠️ If you didn't make this change, please contact our support team immediately at support@deauth.in
    
    © ${new Date().getFullYear()} Deauth. All rights reserved.
    `;

    await sendEmailMiddleware(
      req,
      res,
      mail,
      subject,
      htmlContent,
      textContent,
    );

    logger.info(`Password updated successfully for user ${userId}`);
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error(`Password update error for user: ${err}`);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const loginUser = async (req: any, res: Response) => {
  try {
    const { email, password } = req.body;
    const userRecord = await user.findOne({ email });

    if (!userRecord) {
      return res.status(201).json({ message: 'Invalid Credentials' });
    }
    const hashedPassword = String(userRecord.password);
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
      return res.status(201).json({ message: 'Invalid Credentials' });
    }
    const modifiedUserData = { ...userRecord.toObject() };
    let role = 'user';
    let designerId;
    // Omit the password field
    delete modifiedUserData.password;

    // TODO: add isDesigner and designerId to the user object to skip additional call
    // If the user is a designer, find the designerId
    if (modifiedUserData.isDesigner) {
      const designerObj = await designer.findOne({
        userId: modifiedUserData._id,
      });
      if (designerObj) {
        role = 'designer';
        designerId = designerObj._id;
      }
    }

    const payload: JWTUserPayload = {
      userId: modifiedUserData._id,
      role,
      designerId,
    };
    const token = signJwt(payload);
    return res
      .status(200)
      .json({ message: 'Success', data: modifiedUserData, token });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Addresses Controllers
const addAddress = async (req: any, res: Response) => {
  const {
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    address_type,
  } = req.body;
  const user_id = req.user?.userId || null;
  try {
    // const duplicateAddresses = await address.aggregate([
    //   {
    //     $group: {
    //       _id: {
    //         address_line1,
    //         address_line2,
    //         state,
    //         city,
    //         postal_code,
    //         country,
    //         address_type,
    //       },
    //       count: { $sum: 1 },
    //     },
    //   },
    //   {
    //     $match: { count: { $gt: 1 } },
    //   },
    // ]);

    // if (duplicateAddresses.length > 0) {
    //   return res.status(201).json({
    //     message: 'Duplicate addresses found',
    //     duplicates: duplicateAddresses,
    //   });
    // }
    console.log('user_id: ', user_id);
    const userCheck = await user.findById(user_id);

    if (!userCheck) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    console.log('userCheck: ', newAddress);
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

const getAddress = async (req: any, res: Response) => {
  let { userId } = req.params;
  if (!userId) {
    userId = req.user?.userId;
  }
  const { type } = req.query;

  try {
    const userData = await user.findById(userId).populate({
      path: 'addresses',
      match: type ? { address_type: type } : {}, // Filter by address type if specified
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = userData.addresses || [];

    return res.status(200).json({ addresses });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
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

    // Check if the designer's ID already exists in the user's following array
    if (CheckUser.following.includes(designerId)) {
      return res
        .status(400)
        .json({ message: 'User is already following the designer' });
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

const unfollowDesigner = async (req: Request, res: Response) => {
  try {
    const { userId, designerId } = req.body;

    // Check if the user and designer exist
    const CheckUser = await user.findById(userId);
    const CheckDesigner = await designer.findById(designerId);

    if (!CheckUser || !CheckDesigner) {
      return res.status(404).json({ message: 'User or designer not found' });
    }

    // Check if the designer's ID exists in the user's following array
    if (!CheckUser.following.includes(designerId)) {
      return res
        .status(400)
        .json({ message: 'User is not following the designer' });
    }

    // Remove the designer's ID from the user's following array
    CheckUser.following = CheckUser.following.filter((id) => id !== designerId);
    await CheckUser.save();

    // Remove the user's ID from the designer's followers array
    CheckDesigner.followers = CheckDesigner.followers.filter(
      (id) => id !== userId,
    );
    await CheckDesigner.save();

    return res
      .status(200)
      .json({ message: 'User has unfollowed the designer' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// controllers for handling cart operations

// =========!!! ADD CHECK FOR AVAILABLE QUANTITY ============
// Add a product to the user's cart
const addToCart = async (req: any, res: Response) => {
  const { productId, quantity, size, color } = req.body;
  const userId = req.user?.userId || null; // Assuming user ID is available in req.user

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!productId || !quantity || !size || !color) {
    return res
      .status(400)
      .json({ message: 'Product ID, quantity, size, and color are required' });
  }

  try {
    // Find the user by ID
    const checkProduct = await finalProduct.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Check if the product with same size and color is already in the cart
    const cartItem = checkUser.cart.find(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.size === size &&
        item.color === color,
    );

    if (cartItem) {
      // Update the quantity if the product with same size and color is already in the cart
      cartItem.quantity += quantity;
    } else {
      // Add the product to the cart if it's not already there with this size/color combination
      checkUser.cart.push({ product: productId, quantity, size, color });
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
const changeCartQuantity = async (req: any, res: Response) => {
  const { productId, quantity, size, color } = req.body;
  const userId = req.user?.userId || null; // Assuming user ID is available in req.user

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!productId || !quantity || !size || !color) {
    return res
      .status(400)
      .json({ message: 'Product ID, quantity, size, and color are required' });
  }

  try {
    // Find the user by ID
    const checkProduct = await finalProduct.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Find the cart item corresponding to the product with specific size and color
    const cartItem = checkUser.cart.find(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.size === size &&
        item.color === color,
    );

    if (!cartItem) {
      return res.status(404).json({
        message: 'Product with specified size and color not found in cart',
      });
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
const removeFromCart = async (req: any, res: Response) => {
  const { productId, size, color } = req.body;
  const userId = req.user?.userId || null; // Assuming user ID is available in req.user

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Validate required fields
  if (!productId || !size || !color) {
    return res
      .status(400)
      .json({ message: 'Product ID, size, and color are required' });
  }

  try {
    // Find the user by ID
    const checkProduct = await finalProduct.findById(productId);
    const checkUser = await user.findById(userId);

    if (!(checkUser && checkProduct)) {
      return res.status(404).json({ message: 'User or Product not found' });
    }

    // Remove the specific product variant from the cart by filtering it out
    const updatedCart = checkUser.cart.filter(
      (item) =>
        !(
          item.product.toString() === productId.toString() &&
          item.size === size &&
          item.color === color
        ),
    );

    // Check if the item was actually removed
    if (updatedCart.length === checkUser.cart.length) {
      return res.status(404).json({
        message: 'Product with specified size and color not found in cart',
      });
    }

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

// to get basic user info
const getUserInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const userData = await user.findById(userId, {
      username: 1,
      email: 1,
      phone: 1,
      name: 1,
      description: 1,
      _id: 0, // Exclude the _id field
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(userData);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getUserCart = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || null; // Assuming user ID is available in req.user
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch the user details with the cart populated
    const userWithCart = await user
      .findById(userId)
      .populate({
        path: 'cart.product',
        model: 'FinalProduct',
      })
      .exec();

    if (!userWithCart) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract relevant information from the user's cart
    const cartDetails = userWithCart.cart.map((cartItem) => ({
      product: {
        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        productId: cartItem.product._id,
        prodImageUrl:
          // @ts-ignore
          cartItem.product?.prodImages?.length > 0
            ? // @ts-ignore
              cartItem.product.prodImages[0].url
            : '',
        // @ts-ignore
        price: cartItem.product.price,
        // @ts-ignore
        productName: cartItem.product.productName,
        // @ts-ignore
        category: cartItem.product.category,
        // Include any other relevant product details
      },
      quantity: cartItem.quantity,
      size: cartItem.size,
      color: cartItem.color,
    }));

    return res.status(200).json(cartDetails);
  } catch (error) {
    logger.error('Error fetching user cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const clearCart = async (req: any, res: Response) => {
  const userId = req.user?.userId || null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const checkUser = await user.findById(userId);

    if (!checkUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear the cart array
    checkUser.cart = [];
    await checkUser.save();

    return res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createUser,
  handleGoogleAuth,
  loginUser,
  addAddress,
  followDesigner,
  unfollowDesigner,
  getUserCart,
  addToCart,
  removeFromCart,
  changeCartQuantity,
  clearCart,
  updatePassword,
  updateUser,
  getAddress,
  getUserInfo,
};
