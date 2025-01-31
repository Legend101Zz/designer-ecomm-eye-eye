// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import config from '@config/config';
import bodyParser from 'body-parser';
import logger from '@core/utils/logger';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import multer, { Multer } from 'multer';

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
      // Then, process file uploads
      upload.array('image')(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            error: 'File upload failed',
            details: err.message,
          });
        }

        console.log('In cloud:', req.body);

        // Store uploaded images information in req
        req.uploadedImages = req.files.map((file) => ({
          url: file.path, // If using disk storage
          buffer: file.buffer, // If using memory storage
          public_id: file.filename,
        }));

        next();
      });
    });
  } catch (err) {
    console.log('Error in cloudinaryMiddleware:', err);
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

// Create a separate storage instance for final products
const finalProductStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      logger.debug('Storage params request body:');
      logger.deubg(req.body);

      // Read and parse values after form data is processed
      // If metadata is a string, parse it
      const metadata =
        typeof req.body.imageMetadata === 'string'
          ? JSON.parse(req.body.imageMetadata)
          : req.body.imageMetadata;

      const { productName, gender } = req.body;
      const color = metadata?.color;

      // Log what we found
      logger.debug('Parsed storage parameters:');
      logger.debug({
        productName,
        gender,
        color,
        fieldname: file.fieldname,
      });

      // Default folder if parameters are missing
      if (!productName || !gender || !color) {
        logger.warn('Missing some parameters, using default folder', {
          productName,
          gender,
          color,
        });
        return {
          folder: 'final-products/temp',
          allowed_formats: ['jpg', 'png', 'jpeg'],
          resource_type: 'image',
        };
      }

      const position = file.fieldname.includes('front') ? 'front' : 'back';

      return {
        folder: `final-products/${productName}/${gender}/${color}/${position}`,
        allowed_formats: ['jpg', 'png', 'jpeg'],
        resource_type: 'image',
      };
    } catch (error) {
      logger.error('Error in storage params:');
      logger.error(error);
      // Don't throw - provide default folder instead
      return {
        folder: 'final-products/temp',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        resource_type: 'image',
      };
    }
  },
});

// Create separate multer instance for final products
const uploadFinalProduct = multer({
  storage: finalProductStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const finalProductUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    bodyParser.urlencoded({ extended: true })(req, res, () => {
      // Add debug logging here
      logger.debug('Request body before upload:', {
        productName: req.body.productName,
        gender: req.body.gender,
        metadata: req.body.imageMetadata,
      });

      const uploadFields = [
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
      ];

      uploadFinalProduct.fields(uploadFields)(req, res, (err) => {
        if (err) {
          logger.error('File upload error:');
          logger.error({
            error: err,
            body: req.body,
            files: req.files,
          });
          return res.status(400).json({
            error: 'File upload failed',
            details: err.message,
          });
        }

        // Process uploaded files
        if (req.files) {
          const files = req.files as {
            [fieldname: string]: Multer.File[];
          };

          // Add debug logging here too
          logger.debug('Files received:', Object.keys(files));

          req.processedImages = Object.entries(files).map(
            ([fieldName, fileArray]) => {
              const file = fileArray[0];
              const result = {
                position: fieldName.includes('front') ? 'front' : 'back',
                url: file.path,
                filename: file.filename,
                originalName: file.originalname,
              };

              // Log each processed image
              logger.debug('Processed image:', result);

              return result;
            },
          );

          logger.debug(
            `Processed ${req.processedImages.length} images for final product`,
          );
        } else {
          logger.error('No files were uploaded');
          return res.status(400).json({
            error: 'File upload failed',
            details: 'No files were received',
          });
        }

        return next();
      });
    });
  } catch (error) {
    logger.error('Error in finalProductUploadMiddleware:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to process file upload',
    });
  }
};

export default cloudinaryMiddleware;
