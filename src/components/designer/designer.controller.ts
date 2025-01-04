import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import logger from '@core/utils/logger';
import AppError from '@core/utils/appError';
import { designer } from '@components/designer/designer.model';
import { user } from '@components/user/user.model';
import { product } from '@components/product/product.model';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { design } from '@components/design/design.model';
import { address } from '@components/user/userAddress.model';
import { IDesigner } from './designer.interface';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
  uploadedImages?: Array<{ url: string; public_id: string }>;
}
// interface CustomDesignerData extends Omit<IDesigner, 'userId'> {
//   username: any;
//   email: any;
//   following: any;
//   coverImage: any;
//   profileImage: any;
// }

interface DesignerRequest {
  userId: string;
  fullname: string;
  artistName: string;
  description?: string;
  portfolioLinks?: string[];
  cvLinks?: string[];
  phone: string;
  panCardNumber: string;
  addressBody: any; // Replace with proper address interface
}

const sendDesignerRequestEmail = async (
  // eslint-disable-next-line @typescript-eslint/no-shadow
  user: any,
  designerData: DesignerRequest,
) => {
  const subject = 'Designer Profile Request Received - Deauth';
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
          padding: 20px;
        }
        .header {
          background-color: #292929;
          color: white;
          text-align: center;
          padding: 30px 20px;
          border-radius: 12px 12px 0 0;
        }
        .logo {
          width: 180px;
          height: auto;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #ffffff;
        }
        .content {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .status-box {
          background-color: #fff9f0;
          border-left: 4px solid #ff7d04;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .status-box h3 {
          color: #ff7d04;
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .details {
          background-color: #f9f9f9;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .details h3 {
          color: #292929;
          margin: 0 0 15px 0;
        }
        .details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .details li {
          padding: 8px 0;
          border-bottom: 1px solid #eeeeee;
        }
        .details li:last-child {
          border-bottom: none;
        }
        .steps {
          background-color: #292929;
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .steps h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 10px 0;
        }
        .contact {
          background-color: #fff9f0;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
        }
        .contact a {
          color: #ff7d04;
          text-decoration: none;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          color: #666666;
          font-size: 12px;
          border-top: 1px solid #eeeeee;
        }
        .footer a {
          color: #ff7d04;
          text-decoration: none;
          margin: 0 10px;
        }
        .highlight {
          color: #ff7d04;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.deauth.in/_next/image?url=%2Flogos%2Flogo.webp&w=256&q=75" alt="Deauth Logo" class="logo">
          <h1>Designer Profile Request Received</h1>
        </div>
        
        <div class="content">
          <p>Hello <span class="highlight">${designerData.fullname}</span>,</p>
          
          <div class="status-box">
            <h3>🎨 Your Request is Under Review</h3>
            <p>We've received your application to become a Deauth designer. We're excited to review your creative portfolio!</p>
          </div>
          
          <div class="details">
            <h3>Profile Details Submitted</h3>
            <ul>
              <li><strong>Artist Name:</strong> ${designerData.artistName}</li>
              <li><strong>Phone:</strong> ${designerData.phone}</li>
              ${
                designerData.description
                  ? `<li><strong>Description:</strong> ${designerData.description}</li>`
                  : ''
              }
            </ul>
          </div>

          <div class="steps">
            <h3>Next Steps</h3>
            <ol>
              <li>Our team will carefully review your application and portfolio</li>
              <li>We'll verify your submitted documents and credentials</li>
              <li>You'll receive an email with our decision within 2-3 business days</li>
            </ol>
          </div>

          <div class="contact">
            <p>Have questions? Our designer support team is here to help!</p>
            <a href="mailto:designer.support@deauth.in">designer.support@deauth.in</a>
          </div>
        
          <div class="footer">
            <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
            <div>
              <a href="https://deauth.in/privacy">Privacy Policy</a> | 
              <a href="https://deauth.in/terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Keep the plain text version for email clients that don't support HTML
  const textContent = `
Designer Profile Request Received - Deauth

Hello ${designerData.fullname},

We've received your application to become a Deauth designer. We're excited to review your creative portfolio!

Profile Details Submitted:
- Artist Name: ${designerData.artistName}
- Phone: ${designerData.phone}
${designerData.description ? `- Description: ${designerData.description}` : ''}

Next Steps:
1. Our team will carefully review your application and portfolio
2. We'll verify your submitted documents and credentials
3. You'll receive an email with our decision within 2-3 business days

Questions? Contact our designer support team at designer.support@deauth.in

© ${new Date().getFullYear()} Deauth. All rights reserved.
`;

  await sendEmailMiddleware(
    null,
    null,
    user.email,
    subject,
    htmlContent,
    textContent,
  );
};

// Helper function for cleanup
async function cleanup(
  designerDoc: any,
  addressDoc: any,
  cloudinaryIds: string[],
): Promise<void> {
  try {
    // Delete created designer if it exists
    // eslint-disable-next-line no-underscore-dangle
    if (designerDoc?._id) {
      // eslint-disable-next-line no-underscore-dangle
      await designer.findByIdAndDelete(designerDoc._id);
      // eslint-disable-next-line no-underscore-dangle
      logger.info(`Cleaned up designer: ${designerDoc._id}`);
    }

    // Delete created address if it exists
    // eslint-disable-next-line no-underscore-dangle
    if (addressDoc?._id) {
      // eslint-disable-next-line no-underscore-dangle
      await address.findByIdAndDelete(addressDoc._id);
      // eslint-disable-next-line no-underscore-dangle
      logger.info(`Cleaned up address: ${addressDoc._id}`);
    }

    // Delete uploaded images from Cloudinary
    if (cloudinaryIds.length > 0) {
      await Promise.all(
        cloudinaryIds.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
            logger.info(`Cleaned up Cloudinary image: ${publicId}`);
          } catch (cloudinaryError) {
            logger.error(
              `Failed to clean up Cloudinary image ${publicId}:`,
              cloudinaryError,
            );
          }
        }),
      );
    }
  } catch (cleanupError) {
    logger.error('Error during cleanup:', cleanupError);
  }
}

// Helper function for design cleanup
async function cleanupDesign(
  designDoc: any,
  cloudinaryIds: string[],
): Promise<void> {
  try {
    // Delete created design if it exists
    // eslint-disable-next-line no-underscore-dangle
    if (designDoc?._id) {
      // eslint-disable-next-line no-underscore-dangle
      await design.findByIdAndDelete(designDoc._id);
      // eslint-disable-next-line no-underscore-dangle
      logger.info(`Cleaned up design: ${designDoc._id}`);
    }

    // Delete uploaded images from Cloudinary
    if (cloudinaryIds.length > 0) {
      await Promise.all(
        cloudinaryIds.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
            logger.info(`Cleaned up Cloudinary image: ${publicId}`);
          } catch (cloudinaryError) {
            logger.error(
              `Failed to clean up Cloudinary image ${publicId}:`,
              cloudinaryError,
            );
          }
        }),
      );
    }
  } catch (cleanupError) {
    logger.error('Error during cleanup:', cleanupError);
  }
}

// Helper function to clean up Cloudinary images
async function cleanupCloudinaryImages(
  uploadedImages: any[] = [],
): Promise<void> {
  if (uploadedImages.length > 0) {
    try {
      await Promise.all(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.public_id),
        ),
      );
    } catch (error) {
      logger.error('Error cleaning up Cloudinary images:', error);
    }
  }
}

const requestDesigner = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  // Track created resources for cleanup in case of error
  let createdDesigner = null;
  let createdAddress = null;
  let uploadedImages: string[] = [];

  try {
    const {
      userId,
      fullname,
      artistName,
      description,
      portfolioLinks,
      cvLinks,
      phone,
      panCardNumber,
      addressBody,
    } = req.body;

    // Check if user exists and is not already a designer
    const checkUser: any = await user.findById(userId);
    if (!checkUser) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (checkUser.isDesigner) {
      // Clean up any uploaded images
      await cleanupCloudinaryImages(req.uploadedImages);
      return res
        .status(201)
        .send({ message: 'User is already a registered Designer' });
    }

    // Track uploaded images for potential cleanup
    if (req.uploadedImages) {
      uploadedImages = req.uploadedImages.map((img) => img.public_id);
    }

    // Create new designer
    // eslint-disable-next-line new-cap
    const newDesigner = new designer({
      userId,
      fullname,
      artistName,
      description,
      portfolioLinks,
      cvLinks,
      phone,
      panCardNumber,
    });

    // Handle profile photo and cover photo uploads
    if (req.files?.length >= 2) {
      const [profilePhoto, coverPhoto] = req.files;
      // @ts-ignore - Ignore type checking for image assignment
      newDesigner.profileImage = {
        url: profilePhoto.path,
        filename: profilePhoto.filename,
      };
      // @ts-ignore - Ignore type checking for image assignment
      newDesigner.coverImage = {
        url: coverPhoto.path,
        filename: coverPhoto.filename,
      };
    }

    // Create new address
    // eslint-disable-next-line new-cap
    const newAddress = new address({
      ...addressBody,
      user_id: userId,
    });

    // Save address first to get its ID
    createdAddress = await newAddress.save();
    // eslint-disable-next-line no-underscore-dangle
    newDesigner.legal_address = [createdAddress._id];

    // Save designer
    createdDesigner = await newDesigner.save();

    // Update user's designer status
    checkUser.isDesigner = true;
    await checkUser.save();

    // Send confirmation email
    await sendDesignerRequestEmail(checkUser, req.body);

    return res.status(httpStatus.CREATED).json({
      message: 'Designer profile request submitted successfully',
      // eslint-disable-next-line no-underscore-dangle
      designerId: createdDesigner._id,
    });
  } catch (error) {
    logger.error(`Designer creation error:`, error);

    // Perform cleanup in reverse order of creation
    await cleanup(createdDesigner, createdAddress, uploadedImages);

    return next(
      new AppError(httpStatus.BAD_REQUEST, 'Designer was not created!'),
    );
  }
};

const addProfilePhoto = async (req: CustomRequest, res: Response) => {
  const { designerId } = req.body;
  const { path, filename } = req.files[0];

  try {
    const updatedDesigner = await designer.findByIdAndUpdate(
      designerId,
      { profileImage: { url: path, filename } }, // Set the profileImage directly
      { new: true }, // Return the updated document
    );

    if (!updatedDesigner) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    return res.status(200).json(updatedDesigner);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const addPanCard = async (req: CustomRequest, res: Response) => {
  const { designerId } = req.body;
  const { path, filename } = req.files[0];

  try {
    const updatedDesigner = await designer.findByIdAndUpdate(
      designerId,
      { $push: { panCard: { url: path, filename } } },
      { new: true }, // Return the updated document
    );

    if (!updatedDesigner) {
      return res.status(404).json({ message: 'Designer  not found' });
    }

    return res.status(200).json(updatedDesigner);
  } catch (error) {
    logger.error(error); // You can use console.error instead of logger.error
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateDesignerProfile = async (req: Request, res: Response) => {
  const { designerId, updates } = req.body;

  try {
    // Initialize the update object
    const updateObj: any = {};

    // Dynamically add fields to the update object if they exist in the updates
    if (updates.legal_first_name !== undefined) {
      updateObj.legal_first_name = updates.legal_first_name;
    }
    if (updates.legal_last_name !== undefined) {
      updateObj.legal_last_name = updates.legal_last_name;
    }
    if (updates.description !== undefined) {
      updateObj.description = updates.description;
    }

    // Handle legal_address directly as an array of ObjectIds
    if (updates.legal_address !== undefined) {
      updateObj.legal_address = updates.legal_address;
    }

    // Use $set for the update object
    const setObj: any = {
      $set: updateObj,
    };

    // Handle socialMedia and portfolioLinks separately to append new entries
    if (updates.socialMedia) {
      setObj.$push = {
        socialMedia: { $each: updates.socialMedia },
      };
    }
    if (updates.portfolioLinks) {
      if (!setObj.$push) {
        setObj.$push = {};
      }
      setObj.$push.portfolioLinks = { $each: updates.portfolioLinks };
    }

    const updatedDesigner = await designer.findByIdAndUpdate(
      designerId, // Find the designer by userId
      setObj,
      { new: true }, // Return the updated document
    );

    if (!updatedDesigner) {
      return res
        .status(404)
        .send({ success: false, message: 'Designer not found' });
    }

    return res.status(200).send({ success: true, designer: updatedDesigner });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .send({ success: false, message: 'Internal server error' });
  }
};

// controller for showing designer's public data
const publicData = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    // Find the designer by ID
    const designerData = await designer
      .findById(designerId)
      .populate('settings.showDesigns.designIds');

    if (!designerData) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Check if settings exist
    if (!designerData.settings) {
      return res.status(400).json({
        message:
          'Designer settings not found. Please set up your profile settings first.',
        needsSettings: true,
      });
    }

    // Check if the profile is private
    if (designerData.settings.isPrivate) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    // Extract relevant data based on settings
    const publicDesignerData: any = {};

    // Include fields based on settings
    if (designerData.settings.showFullName) {
      publicDesignerData.fullname = designerData.artistName;
    }

    if (designerData.settings.showPhone) {
      publicDesignerData.phone = designerData.phone;
    }

    if (designerData.settings.showCoverPhoto && designerData.coverImage) {
      publicDesignerData.coverImage = designerData.coverImage.url;
    }

    if (designerData.settings.showProfilePhoto && designerData.profileImage) {
      publicDesignerData.profileImage = designerData.profileImage.url;
    }

    if (designerData.settings.showDescription) {
      publicDesignerData.description = designerData.description;
    }

    if (
      designerData.settings.socialMedia &&
      designerData.settings.socialMedia.length > 0
    ) {
      publicDesignerData.socialMedia = designerData.socialMedia;
    }

    if (
      designerData.settings.portfolioLinks &&
      designerData.settings.portfolioLinks.length > 0
    ) {
      publicDesignerData.portfolioLinks = designerData.portfolioLinks;
    }

    if (
      designerData.settings.showDesigns?.enabled &&
      designerData.settings.showDesigns.designIds?.length > 0
    ) {
      publicDesignerData.designs =
        designerData.settings.showDesigns.designIds.map((design1: any) => ({
          title: design1.title,
          description: design1.description,
          designImage: design1.designImage[0]?.url,
        }));
    }

    return res.status(200).json(publicDesignerData);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// controller for showing designer's own data
const personalData = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    // console.log('id_here', designerId);
    // Find the designer by ID
    const designerData = await designer.findById(designerId);

    // Designer's all designs
    const designData = await design.find({ designer: designerId });

    if (!designData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract the desired fields for the public data
    const publicDesignerData: any = {
      profileImage: designerData.profileImage,
      coverImage: designerData.coverImage,
      legal_first_name: designerData.legal_first_name,
      legal_last_name: designerData.legal_last_name,
      fullname: designerData.fullname,
      artistName: designerData.artistName,
      description: designerData.description,
      socialMedia: designerData.socialMedia,
      phone: designerData.phone,
      portfolioLinks: designerData.portfolioLinks,
      cvLinks: designerData.cvLinks,
      isApproved: designerData.isApproved,
    };

    return res.status(200).json(publicDesignerData);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// Middleware function to check if a designer is approved
const checkDesignerApproval = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const designerId = req.body.designerId || req.params.designerId;
  logger.debug(designerId);

  try {
    // Find the designer document by ID
    const designerDoc = await designer.findById(designerId);

    if (!designerDoc) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Check if the designer is approved
    if (!designerDoc.isApproved) {
      return res.status(401).json({ message: 'Designer is not approved' });
    }

    // If the designer is approved, proceed to the next middleware or route handler
    return next();
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// controller for creating design
const createDesign = async (req: CustomRequest, res: Response) => {
  let savedDesign = null;
  const cloudinaryIds: string[] = [];

  try {
    const { designerId, title, description, tags } = req.body;

    // Validate required fields
    if (!designerId || !title || !tags) {
      return res.status(400).json({
        message:
          'Missing required fields. Title, designerId, and tags are required.',
      });
    }

    // Validate tags format
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        message: 'Tags must be provided as a non-empty array',
      });
    }

    // Process tags: trim whitespace and remove duplicates
    const processedTags = [...new Set(tags.map((tag) => tag.trim()))].filter(
      (tag) => tag.length > 0,
    );

    if (processedTags.length === 0) {
      return res.status(400).json({
        message: 'At least one valid tag is required',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No design image provided' });
    }

    const { path, filename } = req.files[0];
    cloudinaryIds.push(filename); // Store Cloudinary ID for cleanup if needed

    // Check if the designer exists and is approved
    const existingDesigner = await designer.findById(designerId);
    if (!existingDesigner) {
      // Cleanup uploaded image since designer wasn't found
      await cleanupDesign(null, cloudinaryIds);
      return res.status(404).json({ message: 'Designer not found' });
    }

    if (!existingDesigner.isApproved) {
      // Cleanup uploaded image since designer isn't approved
      await cleanupDesign(null, cloudinaryIds);
      return res.status(403).json({ message: 'Designer not approved' });
    }

    // Create a new design
    const newDesignData = {
      title,
      description,
      tags: processedTags,
      designImage: [{ url: path, filename }],
      designer: designerId,
    };

    // Include productId if provided
    if (req.body.productId) {
      const existingProduct = await product.findById(req.body.productId);
      if (!existingProduct) {
        // Cleanup uploaded image since product wasn't found
        await cleanupDesign(null, cloudinaryIds);
        return res.status(404).json({ message: 'Product not found' });
      }
      // @ts-ignore
      newDesignData.finalProduct = [req.body.productId];
    }

    // Create and save the design
    // eslint-disable-next-line new-cap
    const newDesign = new design(newDesignData);
    savedDesign = await newDesign.save();

    // Add the design reference to the designer's Designs array
    // eslint-disable-next-line no-underscore-dangle
    existingDesigner.Designs.push(savedDesign._id);
    await existingDesigner.save();

    return res.status(201).json({
      message: 'Design created successfully',
      design: savedDesign,
    });
  } catch (error) {
    logger.error('Error creating design:', error);

    // Cleanup any uploaded files and created design
    await cleanupDesign(savedDesign, cloudinaryIds);

    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        // @ts-ignore
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getDesigns = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    // Check if the designer exists
    const existingDesigner = await designer.findById(designerId);
    if (!existingDesigner) {
      return res.status(404).json({ error: 'Designer not found.' });
    }

    // Fetch designs of the specified designer
    const designs = await design
      .find({ designer: designerId })
      .populate('designer', 'artistName');

    if (!designs || designs.length === 0) {
      return res.status(404).json({ error: 'Designer has no designs.' });
    }

    // Extract relevant information from designs
    const formattedDesigns = designs.map((design1) => ({
      title: design1.title,
      description: design1.description,
      // @ts-ignore
      designImages: design1.designImage.map((image) => ({
        url: image.url,
      })),
    }));

    // Response with designer and design images
    return res.json({
      designs: formattedDesigns,
    });
  } catch (error) {
    logger.error('Error fetching design images:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// const designByCategory = async (req: Request, res: Response) => {
//   try {
//     const { designerId } = req.params;
//     const { productCategory } = req.query;
//     // Find the designer by ID
//     const designerCheck = await designer.findById(designerId);
//     if (!designerCheck) {
//       return res.status(404).json({ message: 'Designer not found' });
//     }

//     // Find the product by category or fetch all products if the category is not specified
//     let products: any;
//     if (productCategory) {
//       products = await product.find({ category: productCategory });
//     } else {
//       products = await product.find();
//     }

//     console.log('products', products);

//     if (products.length === 0) {
//       return res
//         .status(404)
//         .json({ message: 'No products found for the given category' });
//     }

//     // Find designs for the specified designer and product category
//     const designs = await design
//       .find({
//         // eslint-disable-next-line no-underscore-dangle
//         designer: designerCheck._id,
//         // eslint-disable-next-line no-underscore-dangle
//         'product.productId': { $in: products.map((product1) => product1._id) },
//       })
//       .select('title description product.images.url -_id');

//     if (designs.length === 0) {
//       return res.status(404).json({
//         message:
//           'No products found for the given category made by this designer',
//       });
//     }

//     return res.status(200).json(designs);
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// get random designer to be changed later

const getRandomDesigners = async (req: Request, res: Response) => {
  try {
    const count = await designer.countDocuments({
      profileImage: { $exists: true },
      Designs: { $exists: true, $ne: [] },
    });

    const randomSkip = Math.floor(Math.random() * count);

    const designers = await designer
      .find({
        profileImage: { $exists: true },
        Designs: { $exists: true, $ne: [] },
      })
      .skip(randomSkip)
      .limit(5)
      .populate('Designs');

    const randomDesigners = designers.map((designer2) => ({
      profileImage: designer2.profileImage?.url || null,
      designImage:
        designer2.Designs.length > 0 &&
        designer2.Designs[0].designImage.length > 0
          ? designer2.Designs[0].designImage[0].url
          : null,
      totalDesigns: designer2.Designs.length,
      designerFollowers: designer2.followers.length,

      designName:
        // @ts-ignore
        designer2.Designs.length > 0 ? designer2.Designs[0].title : '',
      // eslint-disable-next-line no-underscore-dangle
      designerId: designer2._id.toString(),
      designerName: designer2.artistName || designer2.fullname || '',
    }));

    res.json(randomDesigners);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// SETTINGS CONTROLLERS

const getSettings = async (req: Request, res: Response) => {
  const { designerId } = req.params;

  try {
    const existingDesigner = await designer
      .findById(designerId)
      .select('settings');

    return res.status(200).json(existingDesigner);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateSettings = async (req: Request, res: Response) => {
  const { designerId } = req.params;

  try {
    const existingDesigner = await designer.findById(designerId);
    // console.log('Dessign', req.body);
    // If the existing designer does not have a settings object, create one
    if (!existingDesigner.settings) {
      existingDesigner.settings = {};
    }

    // Update settings based on the fields present in req.body.settings
    if (req.body.settings) {
      const { settings } = req.body;

      // Loop through each field in req.body.settings and update existingDesigner.settings
      Object.keys(settings).forEach((field) => {
        existingDesigner.settings[field] = settings[field];
      });
    }

    // Copy socialMedia if not provided in the request body
    if (!req.body.settings?.socialMedia && existingDesigner.socialMedia) {
      existingDesigner.settings.socialMedia = existingDesigner.socialMedia;
    }

    // Copy portfolioLinks if not provided in the request body
    if (!req.body.settings?.portfolioLinks && existingDesigner.portfolioLinks) {
      existingDesigner.settings.portfolioLinks =
        existingDesigner.portfolioLinks;
    }
    // console.log('Dessign', existingDesigner.settings);
    // Save the updated designer
    const updatedDesigner = await existingDesigner.save();

    return res.status(200).json(updatedDesigner);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// middleware

const transformToArray = (req: Request, res: Response, next: NextFunction) => {
  // console.log('transform midd hitt', req.body);
  const { portfolioLinks, cvLinks } = req.body;

  if (typeof portfolioLinks === 'string') {
    req.body.portfolioLinks = portfolioLinks
      .split(',')
      .map((link) => link.trim());
  }

  if (typeof cvLinks === 'string') {
    req.body.cvLinks = cvLinks.split(',').map((link) => link.trim());
  }

  next();
};

// eslint-disable-next-line import/prefer-default-export
export {
  requestDesigner,
  updateDesignerProfile,
  addProfilePhoto,
  addPanCard,
  checkDesignerApproval,
  publicData,
  createDesign,
  personalData,
  getDesigns,
  // designByCategory,
  getRandomDesigners,
  updateSettings,
  getSettings,
  transformToArray,
};
