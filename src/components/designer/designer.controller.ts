import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { designer } from '@components/designer/designer.model';
import { user } from '@components/user/user.model';
import { product } from '@components/product/product.model';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { design } from '@components/design/design.model';
import { IDesigner } from './designer.interface';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}
interface CustomDesignerData extends Omit<IDesigner, 'userId'> {
  username: any;
  email: any;
  following: any;
}

const requestDesigner = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const subject = 'Designer Profile Creation Request';
  const text = ' Please wait while we review your profile';

  try {
    const checkUser: any = await user.findById(userId);
    const email = `${checkUser.email}`;
    // console.log(checkUser);
    if (checkUser.isDesigner) {
      return res
        .status(201)
        .send({ message: 'User is already a registered Designer ' });
    }
    // eslint-disable-next-line new-cap
    const newDesigner = new designer({ userId });
    checkUser.isDesigner = true;
    await checkUser.save();
    await newDesigner.save();
    return sendEmailMiddleware(req, res, email, subject, text);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error', err });
  }
};

const addProfilePhoto = async (req: CustomRequest, res: Response) => {
  const { designerId } = req.body;
  const { path, filename } = req.files[0];

  try {
    const updatedDesigner = await designer.findByIdAndUpdate(
      designerId,
      { $push: { profileImage: { url: path, filename } } },
      { new: true }, // Return the updated document
    );

    if (!updatedDesigner) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    return res.status(200).json(updatedDesigner);
  } catch (error) {
    logger.error(error); // You can use console.error instead of logger.error
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
    const updatedDesigner = await designer.findByIdAndUpdate(
      { _id: designerId }, // Find the designer by userId
      {
        $set: {
          legal_first_name: updates.legal_first_name || '',
          legal_last_name: updates.legal_last_name || '',
          description: updates.description || '',
          legal_address: updates.legal_address || '',
        },
        $push: {
          socialMedia: { $each: updates.socialMedia || [] },
          portfolioLinks: { $each: updates.portfolioLinks || [] },
        },
      },
      { new: true }, // Return the updated document
    );

    if (!updatedDesigner) {
      return res
        .status(201)
        .send({ success: false, message: 'Designer not found' });
    }

    return res.status(200).send({ success: true, designer: updatedDesigner });
  } catch (error) {
    logger.error(error); // You can use console.error instead of logger.error
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
    const designerData = await designer.findById(designerId);
    // console.log(designerData);
    if (!designerData) {
      return res.status(404).json({ message: 'Designer not found' });
    }
    // designer's user id
    const userData = await user
      .findById(designerData.userId)
      .populate({ path: 'following', select: 'userId' })
      .exec();

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract the desired fields for the public data
    const publicDesignerData: CustomDesignerData = {
      username: userData.username,
      email: userData.email,
      following: userData.following,
      isApproved: designerData.isApproved, // Assuming you have a "following" field in the User schema
    };

    // Include non-empty fields from designerData
    if (designerData.legal_first_name) {
      publicDesignerData.legal_first_name = designerData.legal_first_name;
    }
    if (designerData.legal_last_name) {
      publicDesignerData.legal_last_name = designerData.legal_last_name;
    }
    if (designerData.description) {
      publicDesignerData.description = designerData.description;
    }
    if (designerData.socialMedia && designerData.socialMedia.length > 0) {
      publicDesignerData.socialMedia = designerData.socialMedia;
    }
    if (designerData.portfolioLinks && designerData.portfolioLinks.length > 0) {
      publicDesignerData.portfolioLinks = designerData.portfolioLinks;
    }

    // Now, let's populate the 'following' field manually
    const followingUserIds = userData.following.map(
      (followedUser: any) => followedUser.userId,
    );

    // Query to retrieve usernames based on user IDs
    const followingUsernames = await user.find(
      { _id: { $in: followingUserIds } },
      'username',
    );

    // Extract the usernames and add them to publicDesignerData
    publicDesignerData.following = followingUsernames.map(
      (check) => check.username,
    );

    return res.status(200).json(publicDesignerData);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware function to check if a designer is approved
const checkDesignerApproval = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { designerId } = req.body;

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
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// controller for creating design
const createDesign = async (req: CustomRequest, res: Response) => {
  try {
    // Extract data from the request
    const { title, description, designerId, productId } = req.body;
    const { path, filename } = req.files[0];

    // Check if the designer exists
    const existingDesigner: any = await designer.findById(designerId);
    if (!existingDesigner) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Check if the product exists
    const existingProduct = await product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create a new design

    // eslint-disable-next-line new-cap
    const newDesign = new design({
      title,
      description,
      designImage: [{ url: path, filename }],
      designer: designerId,
      product: productId,
    });

    // Save the design
    const savedDesign = await newDesign.save();

    // Add the design reference to the designer's Designs array
    // eslint-disable-next-line no-underscore-dangle
    existingDesigner.Designs.push(savedDesign._id);
    await existingDesigner.save();

    return res.status(201).json(savedDesign);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
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
};
