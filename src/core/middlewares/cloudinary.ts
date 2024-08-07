// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import config from '@config/config';
import bodyParser from 'body-parser';
import logger from '@core/utils/logger';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Define a custom Request type that extends express.Request
interface CustomRequest extends Request {
  file: any; // Include the 'file' property with the MulterFile type
}

// Configure Cloudinary with your API credentials
cloudinary.config({
  cloud_name: config.cloud,
  api_key: config.cloud_key,
  api_secret: config.cloud_secret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'Eye-Eye-Tee', // Set your desired folder
    allowedFormats: ['jpeg', 'png', 'jpg', 'pdf'],
  },
});

const upload = multer({ storage });

/**
 * Middleware to handle file uploads to Cloudinary.
 * This middleware assumes that the client sends a file with the field name 'file'.
 */
// eslint-disable-next-line import/prefer-default-export
const cloudinaryMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // logger.debug('here');
    // Handle parsing of form data and file uploads using bodyParser and multer
    bodyParser.urlencoded({ extended: false })(req, res, () => {
      console.log('in cloud', req.body);
      upload.array('image')(req, res, (err) => {
        if (err) {
          return res
            .status(400)
            .json({ error: 'File upload failed', details: err.message });
        }

        // Store uploaded images information in req
        req.uploadedImages = req.files.map((file) => ({
          url: file.path,
          public_id: file.filename, // Assuming filename stores Cloudinary's public_id
        }));
        // console.log(req.files);
        return next();
      });
    });
  } catch (err) {
    res.status(500).send({ message: 'Internal Server error' });
  }
};

/**
 * Cleans up uploaded images from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs to be deleted
 * @returns {Promise<void>}
 */
export const cleanupCloudinaryImages = async (
  publicIds: string[],
): Promise<void> => {
  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`Cleaned up image: `);
        logger.info(`${publicId}`);
        console.log(`Cleaned up image: ${publicId}`);
      } catch (cleanupError) {
        logger.error(`Failed to clean up image ${publicId}:`, cleanupError);
      }
    }),
  );
};

export default cloudinaryMiddleware;
