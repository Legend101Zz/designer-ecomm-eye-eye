import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { create, read } from '@components/product/product.service';
import { product } from '@components/product/product.model';
import { Iproduct } from './product.interface';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

const createProd = async (req: Request, res: Response) => {
  const prod = req.body as Iproduct;
  await create(prod);
  res.status(httpStatus.CREATED);
  return res.send({ message: 'Created' });
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

const getProductImages = async (req, res) => {
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

// eslint-disable-next-line import/prefer-default-export
export {
  createProd,
  readProd,
  changeQuan,
  addColor,
  deleteColor,
  addProductImages,
  getProductImages,
};
