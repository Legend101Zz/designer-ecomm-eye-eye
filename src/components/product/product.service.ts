import httpStatus from 'http-status';
import AppError from '@core/utils/appError';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { ProductDocument } from './product.interface';

/**
 * Creates a new product in the database
 * @param {Partial<ProductDocument>} productData - The product data to create
 * @returns {Promise<ProductDocument>} The created product
 * @throws {AppError} If product creation fails
 */
const createProduct = async (
  productData: Partial<ProductDocument>,
): Promise<ProductDocument> => {
  try {
    const newProduct = await product.create(productData);
    logger.debug(`Product created: %O`, newProduct);
    return newProduct;
  } catch (error) {
    logger.error(`Product creation error: %O`, error.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create product');
  }
};

/**
 * Retrieves a product by its ID
 * @param {string} id - The product ID
 * @returns {Promise<ProductDocument | null>} The found product or null
 */
const readProduct = async (id: string): Promise<ProductDocument | null> => {
  try {
    const foundProduct = await product.findById(id);
    return foundProduct;
  } catch (error) {
    logger.error(`Error reading product: %O`, error.message);
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }
};

/**
 * Updates a product by ID
 * @param {string} id - The product ID to update
 * @param {Partial<ProductDocument>} updateData - The data to update
 * @returns {Promise<ProductDocument | null>} The updated product or null
 */
const updateProduct = async (
  id: string,
  updateData: Partial<ProductDocument>,
): Promise<ProductDocument | null> => {
  try {
    const updatedProduct = await product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    logger.debug(`Product updated: %O`, updatedProduct);
    return updatedProduct;
  } catch (error) {
    logger.error(`Product update error: %O`, error.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update product');
  }
};

/**
 * Deletes a product by ID
 * @param {string} id - The product ID to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const result = await product.findByIdAndDelete(id);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }
    logger.debug(`Product ${id} deleted`);
    return true;
  } catch (error) {
    logger.error(`Product deletion error: %O`, error.message);
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete product');
  }
};

export { createProduct, readProduct, updateProduct, deleteProduct };
