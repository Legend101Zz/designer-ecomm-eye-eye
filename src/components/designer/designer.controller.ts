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
  coverImage: any;
  profileImage: any;
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
      // @ts-ignore
      newDesigner.profileImage = {
        url: profilePhotoPath,
        filename: profilePhotoFilename,
      };

      // Handle cover photo upload
      const coverPhotoPath = coverPhoto.path;
      const coverPhotoFilename = coverPhoto.filename;
      // @ts-ignore
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
      isApproved: designerData.isApproved,
      profileImage: designerData.profileImage.url,
      coverImage: designerData.coverImage.url,
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
  try {
    // Extract data from the request
    const { designerId } = req.body;
    console.log('nunu1', req.body, req.files, designerId);
    const { path, filename } = req.files[0];

    // logger.debug(req.body);

    // Check if the designer exists
    const existingDesigner: any = await designer.findById(designerId);
    if (!existingDesigner.isApproved) {
      return res.status(404).json({ message: 'Designer not Approved' });
    }

    // Create a new design
    const newDesignData: {
      designImage: { url: any; filename: any }[];
      designer: any;
      title?: string; //  'title' property optional
      description?: string; //  'description' property optional
      product?: any; //  'product' property optional
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

const designByCategory = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    const { productCategory } = req.query;
    // Find the designer by ID
    const designerCheck = await designer.findById(designerId);
    if (!designerCheck) {
      return res.status(404).json({ message: 'Designer not found' });
    }

    // Find the product by category or fetch all products if the category is not specified
    let products: any;
    if (productCategory) {
      products = await product.find({ category: productCategory });
    } else {
      products = await product.find();
    }

    console.log('products', products);

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: 'No products found for the given category' });
    }

    // Find designs for the specified designer and product category
    const designs = await design
      .find({
        // eslint-disable-next-line no-underscore-dangle
        designer: designerCheck._id,
        // eslint-disable-next-line no-underscore-dangle
        'product.productId': { $in: products.map((product1) => product1._id) },
      })
      .select('title description product.images.url -_id');

    if (designs.length === 0) {
      return res.status(404).json({
        message:
          'No products found for the given category made by this designer',
      });
    }

    return res.status(200).json(designs);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// get random designer to be changed later

const getRandomDesigners = async (req: Request, res: Response) => {
  try {
    // Get the count of all designers with a profile image and non-empty 'Designs' array
    const count = await designer.countDocuments({
      profileImage: { $exists: true },
      Designs: { $exists: true, $ne: [] },
    });

    // Generate a random skip value
    const randomSkip = Math.floor(Math.random() * count);

    // Fetch a random set of designers with a profile image and non-empty 'Designs' array
    const designers = await designer
      .find({
        profileImage: { $exists: true },
        Designs: { $exists: true, $ne: [] },
      })
      .skip(randomSkip)
      .limit(5)
      .populate('Designs');

    console.log(designers);

    // Map the designers to the desired format
    const randomDesigners = designers.map((designer1) => {
      const profileImage = designer1.profileImage?.url || null;
      const designImage =
        // eslint-disable-next-line no-nested-ternary
        designer1.Designs.length > 0
          ? designer1.Designs[0].designImage.length > 0
            ? designer1.Designs[0].designImage[0].url
            : null
          : null;

      return {
        profileImage,
        designImage,
      };
    });

    res.json(randomDesigners);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// SETTINGS CONTROLLERS

const updateSettings = async (req: Request, res: Response) => {
  const { designerId } = req.params;

  try {
    const existingDesigner = await designer.findById(designerId);
    console.log('Dessign', req.body);
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
    console.log('Dessign', existingDesigner.settings);
    // Save the updated designer
    const updatedDesigner = await existingDesigner.save();

    return res.json(updatedDesigner);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
  getDesigns,
  designByCategory,
  getRandomDesigners,
  updateSettings,
};
