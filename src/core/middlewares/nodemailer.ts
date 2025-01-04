// @ts-nocheck

import { Request, Response } from 'express';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '@core/utils/logger';
import config from '@config/config';

// Define a Nodemailer transporter
const transporter: Transporter = nodemailer.createTransport({
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
  port: 465,
  secure: true,
  host: 'smtp.hostinger.com',
});

// Middleware function to send an email
// eslint-disable-next-line import/prefer-default-export
export const sendEmailMiddleware = async (
  req: Request,
  res: Response,
  to: string,
  subject: string,
  html: string,
  text: string,
) => {
  const mailOptions = {
    from: '"Team Deauth" <team@deauth.in>',
    to,
    subject,
    html, // HTML version
    text, // Plain text version as fallback
  };

  // Send the email
  // eslint-disable-next-line consistent-return
  try {
    const info = await transporter.sendMail(mailOptions);
    logger.debug(`Email sent: ${info.response}`);
    return true;
  } catch (error) {
    logger.error(`Email error: ${error}`);
    return false;
  }
};
