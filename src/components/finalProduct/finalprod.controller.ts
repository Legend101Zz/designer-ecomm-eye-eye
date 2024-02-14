import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { design } from '@components/design/design.model';
import { designer } from '@components/designer/designer.model';
import { finalProduct } from './finalprod.model';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

const createFinalProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { designImageUrl } = req.body;
    console.log('createFinalProduct', req.body, req.files);
    // Find the design using the designImageUrl
    const existingDesign = await design.findOne({
      designImage: {
        $elemMatch: { url: designImageUrl },
      },
    });

    if (!existingDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Retrieve the designer ID from the design
    const designerId = existingDesign.designer;

    // Extract product IDs from req.files
    const productIds = req.files.map((file) => {
      const productIdMatch = file.originalname.match(/product_(.+)_image/);
      return productIdMatch ? productIdMatch[1] : null;
    });

    // Filter out null or duplicate product IDs
    const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));

    // Create an array to store finalProduct IDs
    const finalProductIds = [];

    // Create FinalProduct instances for each product ID
    const finalProductsPromises = uniqueProductIds.map(async (productId) => {
      // Find the associated product using the productId
      const productF = await product.findById(productId);

      if (!productF) {
        console.log(`Product with ID ${productId} not found`);
        return null; // Skip creating FinalProduct if the associated product is not found
      }

      // Create a new FinalProduct instance
      // eslint-disable-next-line new-cap
      const newFinalProduct = new finalProduct({
        price: 1000, // You can set default values or adjust as needed
        sales: 0,
        color: productF.color[0],
        category: productF.category,
        prodImages: req.files
          .filter((file) =>
            file.originalname.includes(`product_${productId}_image`),
          )
          .map((file) => ({
            url: file.path,
            filename: file.filename,
          })),
        // eslint-disable-next-line no-underscore-dangle
        designId: existingDesign._id,
        designerId,
        productId,
      });

      // Save the FinalProduct instance to the database
      const savedFinalProduct = await newFinalProduct.save();

      // Add the finalProduct ID to the array
      // eslint-disable-next-line no-underscore-dangle
      finalProductIds.push(savedFinalProduct._id);

      return savedFinalProduct;
    });

    // Wait for all FinalProduct instances to be created
    const finalProducts = await Promise.all(finalProductsPromises);

    // Add the finalProduct IDs to the design's finalProduct array
    existingDesign.finalProduct =
      existingDesign.finalProduct.concat(finalProductIds);

    // Save the design with updated finalProduct array
    await existingDesign.save();

    // Respond with the created FinalProduct instances
    return res.status(201).json({ finalProducts });
  } catch (error) {
    logger.error('Error creating final products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllProductsByDesign = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const { category, color } = req.query;

    // Find the design by designId
    const designF = await design.findById(designId);

    if (!designF) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Define the query for finding products
    const productQuery: { designId: any; category?: string; color?: string } = {
      designId,
    };

    // If category is provided in the query, add it to the query
    if (category) {
      productQuery.category = category as string;
    }
    // If color is provided in the query, add it to the query
    if (color) {
      productQuery.color = color as string;
    }

    // Find all final products based on the query
    const products = await finalProduct
      .find(productQuery)
      .select('price sales color category productId prodImages.url');

    return res
      .status(200)
      .json({ products, designUrl: designF.designImage[0].url });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllProductsByDesigner = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    const { category, color } = req.query;

    // Find the design by designId
    const designF = await designer.findById(designerId);

    if (!designF) {
      return res.status(404).json({ error: 'Designer not found' });
    }

    // Define the query for finding products
    const productQuery: { designerId: any; category?: string; color?: string } =
      {
        designerId,
      };

    // If category is provided in the query, add it to the query
    if (category) {
      productQuery.category = category as string;
    }
    // If color is provided in the query, add it to the query
    if (color) {
      productQuery.color = color as string;
    }

    // Find all final products based on the query
    const products = await finalProduct
      .find(productQuery)
      .select('price sales color category productId prodImages.url');

    return res.status(200).json({ products });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCategoriesWithoutFinalProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const { designerId } = req.params;
    const { designImageUrl } = req.body;

    console.log('createFinalProduct', req.body, req.params);

    // If req.body is empty or designImageUrl is empty, fetch categories without specifying designId
    if (!designImageUrl) {
      const categoriesWithProducts = await finalProduct
        .distinct('category', { designerId })
        .exec();

      // Find all categories available in the system
      const allCategories = ['hoodie', 'shirt', 'Tshirt', 'cup'];

      // Calculate categories without final products
      const categoriesWithoutProducts = allCategories.filter(
        (category) => !categoriesWithProducts.includes(category),
      );

      return res.status(200).json({ categoriesWithoutProducts });
    }

    // Find the design using the designImageUrl
    const existingDesign = await design.findOne({
      designImage: {
        $elemMatch: { url: designImageUrl },
      },
    });

    console.log('createFinalProduct', req.params, existingDesign);

    // If designImageUrl is not empty, proceed with the existing logic
    if (!existingDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // eslint-disable-next-line no-underscore-dangle
    const designId = existingDesign._id;

    // Find all categories associated with the designer's designs
    const categoriesWithProducts = await finalProduct
      .distinct('category', { designerId, designId })
      .exec();

    // Find all categories available in the system
    const allCategories = ['hoodie', 'shirt', 'Tshirt', 'cup'];

    // Calculate categories without final products
    const categoriesWithoutProducts = allCategories.filter(
      (category) => !categoriesWithProducts.includes(category),
    );

    return res.status(200).json({ categoriesWithoutProducts });
  } catch (error) {
    console.log('Error in createFinalProduct', error);
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getProducts = async (req: Request, res: Response) => {
  try {
    // Parse the 'page' query parameter or default to 1
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * pageSize;

    let products: any;

    // Check if category query parameter is provided
    const { category } = req.query;

    if (category) {
      // If category is provided, filter products based on category
      products = await finalProduct
        .find({ category })
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'productId',
          model: 'Product',
          select: 'image',
        })
        .populate({
          path: 'designId',
          model: 'Design',
          select: 'title',
        })
        .exec();
    } else {
      // If no category is provided, fetch all products
      products = await finalProduct
        .find()
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'productId',
          model: 'Product',
          select: 'image',
        })
        .populate({
          path: 'designId',
          model: 'Design',
          select: 'title',
        })
        .exec();
    }

    // Extract relevant information from each product
    const formattedProducts = products.map((product1) => {
      const productDetails: any = product1.productId;

      // Extract image URLs from the 'image' array
      const imageUrls = productDetails?.image.map((img) => img.url) || [];
      return {
        mainImageUrl:
          product1.prodImages.length > 0 ? product1.prodImages[0].url : '',
        otherImages: imageUrls,
        price: product1.price,
        category: product1.category,
        color: product1.color,
        name: product1.designId.title,
        // eslint-disable-next-line no-underscore-dangle
        productId: product1._id,
      };
    });

    // Get count of products for each color with the same designId and productId
    // const colorCounts: Record<string, number> = {};

    // products.forEach((product1) => {
    //   const key = `${product1.designId}_${product1.productId}_${product1.color}`;
    //   colorCounts[key] = (colorCounts[key] || 0) + 1;
    // });

    // return res.status(200).json({ products: formattedProducts, colorCounts });
    return res.status(200).json({ products: formattedProducts });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getProductDetailSideView = async (req: Request, res: Response) => {
  try {
    const { finalProductId } = req.body;

    // Fetch final product details
    const finalProduct1 = await finalProduct
      .findById(finalProductId)
      .populate({
        path: 'designerId',
        model: 'Designer',
      })
      .exec();

    if (!finalProduct1) {
      return res.status(404).json({ error: 'Final Product not found' });
    }
    console.log(finalProduct1);

    // Extract relevant information
    const productDetails = {
      prodImageUrl:
        finalProduct1.prodImages.length > 0
          ? finalProduct1.prodImages[0].url
          : '',
      price: finalProduct1.price,
      color: finalProduct1.color,
      designer: {
        name: finalProduct1.designerId.artistName,
        image: finalProduct1.designerId.profileImage
          ? finalProduct1.designerId.profileImage.url
          : '',

        // Include any other relevant designer details
      },
    };

    return res.status(200).json(productDetails);
  } catch (error) {
    logger.error('Error fetching product details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createFinalProduct,
  getAllProductsByDesign,
  getAllProductsByDesigner,
  getCategoriesWithoutFinalProducts,
  getProducts,
  getProductDetailSideView,
};
