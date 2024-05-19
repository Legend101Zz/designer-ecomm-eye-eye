import { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import AppError from '@core/utils/appError';
import { create, read } from '@components/product/product.service';
import { product } from '@components/product/product.model';
import { Iproduct } from './product.interface';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
  uploadedImages?: Array<{ url: string; public_id: string }>;
}

const createProd = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Retrieve form data from req.body
    const { name, quantity, category, color, sizes, basePrice } = req.body;
    console.log(req.body, req.files);
    // Process images
    const images = req.files;
    const updatedImages = images.map((image, index) => {
      let position = 'other';
      if (index === 0) {
        position = 'front';
      } else if (index === 1) {
        position = 'back';
      }
      return {
        url: image.path,
        filename: image.filename,
        position,
      };
    });

    // Create a new product using the Product model
    const newProduct: Iproduct = {
      name,
      quantity: parseInt(quantity, 10),
      category,
      color,
      image: updatedImages,
      sizes,
      basePrice: parseFloat(basePrice),
    };
    throw Error(`hehe`);
    // Save the product to the database
    await create(newProduct);
    res
      .status(httpStatus.CREATED)
      .json({ message: 'Product created successfully' });
  } catch (error) {
    logger.error(`Product creation error: %O`, error);

    // Clean up uploaded images from Cloudinary
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      const deletePromises = req.uploadedImages.map((image) =>
        cloudinary.uploader.destroy(image.public_id),
      );
      await Promise.all(deletePromises);
      console.log('udd gayi images hehe');
    }

    next(new AppError(httpStatus.BAD_REQUEST, 'Product was not added!'));
  }
};

const readProd = async (req: Request, res: Response) => {
  try {
    const prod = req.params.id;
    const data = await read(prod);

    return res.status(200).send({ message: 'success', data });
  } catch (err) {
    logger.error(err);
    return res.status(501).send({ message: 'server error ' });
  }
};

const changeQuan = async (req: Request, res: Response) => {
  try {
    const prod = req.body.productId;
    const data: any = await read(prod);
    data.quantity = req.body.quantity;
    await data.save();
    return res.status(200).send({ message: 'success', data });
  } catch (err) {
    logger.error(err);
    return res.status(501).send({ message: 'server error ' });
  }
};

const addColor = async (req: Request, res: Response) => {
  const { color, productId } = req.body;

  try {
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $addToSet: { color } }, // Add color to the array if it doesn't exist
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteColor = async (req: Request, res: Response) => {
  const { color, productId } = req.body;

  try {
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $pull: { color } }, // Remove the specified color from the array
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const addProductImages = async (req: CustomRequest, res: Response) => {
  const { productId } = req.body;
  const images = req.files; // Assuming req.files is an array of image files

  try {
    const updatedImages = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const image of images) {
      updatedImages.push({ url: image.path, filename: image.filename });
    }

    // Use your Product model to update the image field with all the images
    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $push: { image: { $each: updatedImages } } }, // Add multiple images to the array
      { new: true }, // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error(error); // You can use console.error instead of logger.error
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getProductImages = async (req: Request, res: Response) => {
  try {
    const { color, category } = req.query;

    // Construct the query based on color and category
    const query: any = {};
    if (color) {
      query.color = color;
    }
    if (category) {
      query.category = category;
    }

    // Find products that match the query
    const products = await product.find(query);

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No matching products found' });
    }
    // Extract URLs from the matching products' images

    // Extract product ID and URLs from the matching products' images
    const productImages = products.map((prod) => ({
      // eslint-disable-next-line no-underscore-dangle
      productId: prod._id,
      // @ts-ignore
      imageUrls: prod.image.map((img) => img.url).flat(),
    }));

    return res.status(200).json(productImages);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getColorsByCategory = async (req: Request, res: Response) => {
  const { category } = req.query;

  try {
    const colors = await product.distinct('color', { category });

    res.status(200).json({ colors });
  } catch (error) {
    logger.error('Error fetching colors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getColorsByName = async (req: Request, res: Response) => {
  const { name } = req.query;

  try {
    const products = await product.find({ name }).distinct('color');
    res.status(200).json({ products });
  } catch (error) {
    logger.error('Error fetching unique color products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createProd,
  readProd,
  changeQuan,
  addColor,
  deleteColor,
  addProductImages,
  getProductImages,
  getColorsByCategory,
  getColorsByName,
};
