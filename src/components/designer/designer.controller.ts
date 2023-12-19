import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { designer } from '@components/designer/designer.model';
import { user } from '@components/user/user.model';
import { product } from '@components/product/product.model';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { design } from '@components/design/design.model';
import { address } from '@components/user/userAddress.model';
import { IDesigner } from './designer.interface';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}
interface CustomDesignerData extends Omit<IDesigner, 'userId'> {
  username: any;
  email: any;
  following: any;
}

const requestDesigner = async (req: CustomRequest, res: Response) => {
  const {
    userId,
    fullname,
    artistName,
    description,
    portfolioLinks,
    cvLinks,
    phone,
    panCardNumber,

    // eslint-disable-next-line @typescript-eslint/naming-convention
    address_line1,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    address_line2,
    city,
    state,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    postal_code,
    country,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    address_type,
  } = req.body;

  // console.log(req.body, req.files);

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
    // Create a new designer and add the fields
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

    // Create a new address
    // eslint-disable-next-line new-cap
    const newAddress = new address({
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      address_type,
      user_id: userId,
    });
    checkUser.isDesigner = true;
    // eslint-disable-next-line no-underscore-dangle

    // Handle profile photo and cover photo uploads
    if (req.files.length >= 2) {
      const profilePhoto = req.files[0];
      const coverPhoto = req.files[1];

      // Handle profile photo upload
      const profilePhotoPath = profilePhoto.path;
      const profilePhotoFilename = profilePhoto.filename;
      newDesigner.profileImage = {
        url: profilePhotoPath,
        filename: profilePhotoFilename,
      };

      // Handle cover photo upload
      const coverPhotoPath = coverPhoto.path;
      const coverPhotoFilename = coverPhoto.filename;
      newDesigner.coverImage = {
        url: coverPhotoPath,
        filename: coverPhotoFilename,
      };
    }
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    newDesigner.legal_address.push(newAddress._id);
    // Save all changes
    await Promise.all([
      checkUser.save(),
      newDesigner.save(),
      newAddress.save(),
    ]);

    return sendEmailMiddleware(req, res, email, subject, text);
  } catch (err) {
    console.log(err);
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
    console.log('noooocachasoc');
    // Find the designer by ID
    const designerData = await designer.findById(designerId);

    if (!designerData) {
      return res
        .status(404)
        .json({ message: 'Designer not found', data: req.params });
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
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

// controller for showing designer's own data
const personalData = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    console.log('id_here', designerId);
    // Find the designer by ID
    const designerData = await designer.findById(designerId);
    if (!designerData) {
      return res.status(404).json({ message: 'Designer not found' });
    }

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
      designs: [],
    };

    // Populate designs with design images
    publicDesignerData.designs = designData.map((des) => ({
      designImage: des.designImage,
    }));

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
  const { designerId } = req.body;
  // logger.debug(designerId);

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
  try {
    // Extract data from the request
    const { designerId } = req.body;
    const { path, filename } = req.files[0];
    // logger.debug(req.body);
    // logger.debug(req.files[0]);
    // Check if the designer exists
    const existingDesigner: any = await designer.findById(designerId);
    if (!existingDesigner) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Create a new design
    const newDesignData: {
      designImage: { url: any; filename: any }[];
      designer: any;
      title?: string; // Make 'title' property optional
      description?: string; // Make 'description' property optional
      product?: any; // Make 'product' property optional
    } = {
      designImage: [{ url: path, filename }],
      designer: designerId,
    };

    // Include title and description if provided in the request
    if (req.body.title) {
      newDesignData.title = req.body.title;
    }
    if (req.body.description) {
      newDesignData.description = req.body.description;
    }

    // Include productId if provided in the request
    if (req.body.productId) {
      const existingProduct = await product.findById(req.body.productId);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      newDesignData.product = req.body.productId;
    }

    // eslint-disable-next-line new-cap
    const newDesign = new design(newDesignData);

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
  personalData,
};
