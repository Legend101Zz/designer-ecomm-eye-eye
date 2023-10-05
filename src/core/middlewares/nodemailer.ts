// @ts-nocheck

import { Request, Response } from 'express';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '@core/utils/logger';
import config from '@config/config';

// Define a Nodemailer transporter
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
  port: 465,
  host: 'smtp.gmail.com',
});

// Middleware function to send an email
// eslint-disable-next-line import/prefer-default-export
export const sendEmailMiddleware = (
  req: Request,
  res: Response,
  to: string,
  subject: string,
  text: string,
) => {
  const mailOptions = {
    from: config.mailUser,
    to,
    subject,
    text,
  };

  // Send the email
  // eslint-disable-next-line consistent-return
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
      return res.status(500).json({ error: 'Error sending email' });
    }
    logger.debug(info.response);

    return res.status(200).json({ success: 'mail sent successfully' });
  });
};
