import { NextFunction, Request, Response } from 'express';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '@core/utils/logger';
import config from '@config/config';

// Define a Nodemailer transporter
const transporter: Transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: false, // Set this to true if your SMTP server requires SSL/TLS
  auth: {
    mailUser: config.mailUser,
    mailPass: config.mailUser,
  },
});

// Middleware function to send an email
// eslint-disable-next-line import/prefer-default-export
export const sendEmailMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { to, subject, text } = req.body;

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

    next();
  });
};
