import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import bcrypt from 'bcrypt';
import { designer } from '@components/designer/designer.model';
import { design } from '@components/design/design.model';
import { admin } from './admin.model';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

// creating a admin

const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if an admin with the same email already exists
    const existingAdmin = await admin.findOne({ email });

    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: 'Admin with this email already exists' });
    }

    // Hash the password before saving it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // eslint-disable-next-line new-cap
    const newAdmin = new admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    return res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while creating the admin' });
  }
};

// login admin

const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find the admin by email
    const foundAdmin = await admin.findOne({ email });

    if (!foundAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      foundAdmin.password as string,
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    return res.status(200).json({ message: 'Admin logged in successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while logging in' });
  }
};

// add product

const addProduct = async (req: CustomRequest, res: Response) => {
  try {
    // Retrieve form data from req.body and req.file
    const { name, quantity, category, color } = req.body;

    const images = req.files;

    const updatedImages = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const image of images) {
      updatedImages.push({ url: image.path, filename: image.filename });
    }

    // Create a new product using the Product model
    // eslint-disable-next-line new-cap
    const newProduct = new product({
      name,
      quantity,
      category,
      color: [color],
      image: updatedImages,
    });

    // Save the product to the database
    await newProduct.save();

    res.send('Product added'); // Redirect to the product list page
  } catch (error) {
    logger.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const products = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const { search, category } = req.query;

    // Construct the filter object based on query parameters
    const filter: any = {};
    if (search) {
      // @ts-ignore
      filter.name = { $regex: new RegExp(search, 'i') };
    }
    if (category) {
      filter.category = category;
    }

    // Fetch filtered products from the database
    const prod = await product.find(filter);

    // Render the page with the filtered products
    res.render('products', { products: prod });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const renderEditProductPage = async (req: Request, res: Response) => {
  try {
    // Extract the product ID from the route parameters
    const { productId } = req.params;

    const prod = await product.findById(productId);

    if (!prod) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.render('editProd', {
      title: 'Edit Product',
      productId,
      prod,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const editProduct = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { quantity },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.redirect('/api/admin/products');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
// ============ DESIGNER ============
const allDesigners = async (req: Request, res: Response) => {
  try {
    // Fetch approved designers with populated designs
    const approvedDesigners = await designer
      .find({ isApproved: true })
      .populate({
        path: 'Designs',
        select: 'title description designImage isVerified',
      });

    // Fetch non-approved designers
    const notApprovedDesigners = await designer
      .find({
        isApproved: false,
      })
      .populate({
        path: 'Designs',
        select: 'title description designImage isVerified',
      });

    // Fetch unverified designs with designer information
    const designs = await design
      .find({ isVerified: false })
      .select('title description designImage')
      .populate({
        path: 'designer',
        select: 'artistName fullname profileImage',
      });

    // Log counts for debugging
    console.log(`Found ${approvedDesigners.length} approved designers`);
    console.log(`Found ${notApprovedDesigners.length} pending designers`);
    console.log(`Found ${designs.length} pending designs`);

    // Render the page with the fetched data
    res.render('designer', {
      designs: designs || [],
      approvedDesigners: approvedDesigners || [],
      notApprovedDesigners: notApprovedDesigners || [],
    });
  } catch (e) {
    console.error('Error in allDesigners:', e);
    logger.error(e);
    res
      .status(500)
      .send('Internal Server Error: ' + (e.message || 'Unknown error'));
  }
};

const getDesignerDetails = async (req: Request, res: Response) => {
  try {
    const designer1 = await designer.findById(req.params.id);

    if (!designer1) {
      return res.status(404).send(' heeeh');
    }

    return res.render('designerSingle', { designer: designer1 });
  } catch (e) {
    logger.error(e);
    return res.status(500).send('Internal Server Error');
  }
};

const approveDesignerController = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    // Find the designer by ID and update the 'isApproved' field to true
    const updatedDesigner = await designer.findByIdAndUpdate(
      designerId,
      { isApproved: true },
      { new: true },
    );

    if (!updatedDesigner) {
      return res.status(404).json({ error: 'Designer not foundaaa' });
    }

    return res.redirect('/api/admin/designer');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyDesignController = async (req: Request, res: Response) => {
  const { designId } = req.params;

  try {
    // Find the design by ID
    const foundDesign = await design.findById(designId);

    if (!foundDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Update the 'isVerified' field to true
    foundDesign.isVerified = true;

    // Save the updated design
    await foundDesign.save();

    // Respond with a success message or the updated design
    return res.redirect('/api/admin/designer');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createAdmin,
  loginAdmin,
  addProduct,
  products,
  renderEditProductPage,
  editProduct,
  allDesigners,
  getDesignerDetails,
  approveDesignerController,
  verifyDesignController,
};
