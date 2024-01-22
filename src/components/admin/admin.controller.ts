import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import bcrypt from 'bcrypt';
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
    const passwordMatch = await bcrypt.compare(password, foundAdmin.password);

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

    console.log(updatedImages);
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

// eslint-disable-next-line import/prefer-default-export
export {
  createAdmin,
  loginAdmin,
  addProduct,
  products,
  renderEditProductPage,
  editProduct,
};
