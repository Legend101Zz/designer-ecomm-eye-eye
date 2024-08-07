import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { cleanupCloudinaryImages } from '@core/middlewares/cloudinary';
import { product } from '@components/product/product.model';
import { design } from '@components/design/design.model';
import { designer } from '@components/designer/designer.model';
import {
  IFinalProductResponse,
  DesignApplication,
  GroupedProduct,
} from './finalprod.interface';
import { finalProduct } from './finalprod.model';
interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

function groupProductsByDesignAndCategory(
  finalProducts: any[],
): GroupedProduct[] {
  const groupedMap = new Map<string, GroupedProduct>();

  finalProducts.forEach((finalProd) => {
    const key = `${finalProd.productName}-${
      finalProd.category
    }-${finalProd.designs.map((d) => d.designId).join('-')}`;

    if (!groupedMap.has(key)) {
      const { color, productId, mainImageUrl, otherImages, price, ...rest } =
        finalProd;
      groupedMap.set(key, {
        ...rest,
        colors: [
          {
            color,
            productId,
            mainImageUrl,
            otherImages,
            price,
          },
        ],
      });
    } else {
      const group = groupedMap.get(key)!;
      group.colors.push({
        color: finalProd.color,
        productId: finalProd.productId,
        // @ts-ignore
        mainImageUrl: finalProd.mainImageUrl,
        otherImages: finalProd.otherImages,
        price: finalProd.price,
      });
    }
  });

  return Array.from(groupedMap.values());
}

const formatFinalProduct = (finalProd: any): IFinalProductResponse => {
  const mainImage =
    finalProd.baseProductImages.find((img: any) => img.position === 'front') ||
    finalProd.baseProductImages[0];

  return {
    productId: finalProd._id.toString(),
    productName: finalProd.productName,
    baseProductName: finalProd.productId
      ? finalProd.productId.name
      : 'Unknown Product',
    mainImageUrl: mainImage ? mainImage.url : '',
    otherImages: finalProd.baseProductImages
      .filter((img: any) => img !== mainImage)
      .map((img: any) => img.url),
    price: finalProd.price,
    category: finalProd.category,
    color: finalProd.color,
    sales: finalProd.sales,
    designs: finalProd.appliedDesigns.map((design: any) => ({
      designId: design.designId._id.toString(),
      designName: design.designId ? design.designId.title : 'Unknown Design',
      designerName: design.designerId
        ? design.designerId.artistName
        : 'Unknown Designer',
      position: design.position,
      appliedImageUrl: design.appliedImage.url,
    })),
  };
};
//                    === LEGACY CODE ===

// const createFinalProduct = async (req: CustomRequest, res: Response) => {
//   try {
//     const { designImageUrl } = req.body;
//     console.log('createFinalProduct', req.body, req.files);
//     // Find the design using the designImageUrl
//     const existingDesign = await design.findOne({
//       designImage: {
//         $elemMatch: { url: designImageUrl },
//       },
//     });

//     if (!existingDesign) {
//       return res.status(404).json({ error: 'Design not found' });
//     }

//     // Retrieve the designer ID from the design
//     const designerId = existingDesign.designer;

//     // Extract product IDs from req.files
//     const productIds = req.files.map((file) => {
//       const productIdMatch = file.originalname.match(/product_(.+)_image/);
//       return productIdMatch ? productIdMatch[1] : null;
//     });

//     // Filter out null or duplicate product IDs
//     const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));

//     // Create an array to store finalProduct IDs
//     const finalProductIds = [];

//     // Create FinalProduct instances for each product ID
//     const finalProductsPromises = uniqueProductIds.map(async (productId) => {
//       // Find the associated product using the productId
//       const productF = await product.findById(productId);

//       if (!productF) {
//         console.log(`Product with ID ${productId} not found`);
//         return null; // Skip creating FinalProduct if the associated product is not found
//       }

//       // Create a new FinalProduct instance
//       // eslint-disable-next-line new-cap
//       const newFinalProduct = new finalProduct({
//         price: 1000, // You can set default values or adjust as needed
//         sales: 0,
//         color: productF.color[0],
//         category: productF.category,
//         prodImages: req.files
//           .filter((file) =>
//             file.originalname.includes(`product_${productId}_image`),
//           )
//           .map((file) => ({
//             url: file.path,
//             filename: file.filename,
//           })),
//         // eslint-disable-next-line no-underscore-dangle
//         designId: existingDesign._id,
//         designerId,
//         productId,
//       });

//       // Save the FinalProduct instance to the database
//       const savedFinalProduct = await newFinalProduct.save();

//       // Add the finalProduct ID to the array
//       // eslint-disable-next-line no-underscore-dangle
//       finalProductIds.push(savedFinalProduct._id);

//       return savedFinalProduct;
//     });

//     // Wait for all FinalProduct instances to be created
//     const finalProducts = await Promise.all(finalProductsPromises);

//     // Add the finalProduct IDs to the design's finalProduct array
//     existingDesign.finalProduct =
//       existingDesign.finalProduct.concat(finalProductIds);

//     // Save the design with updated finalProduct array
//     await existingDesign.save();

//     // Respond with the created FinalProduct instances
//     return res.status(201).json({ finalProducts });
//   } catch (error) {
//     logger.error('Error creating final products:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
//
//

/**
 * Create a new final product
 * @route POST /finalproduct/create-final-products
 * @param {CustomRequest} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created final product or error
 *
 * @description Creates a new final product by combining a base product with applied designs.
 * @input
 *   - productId: string (ID of the base product)
 *   - designApplications: Array of DesignApplication objects
 *     {
 *       designImageUrl: string,
 *       position: 'front' | 'back'
 *     }
 *   - images: Array of image files (multipart/form-data)
 * @output
 *   - 201: { finalProduct: IFinalProductResponse } (Created final product details)
 *   - 400: { error: string } (No valid designs provided or invalid input)
 *   - 404: { error: string } (Product or Design not found)
 *   - 500: { error: string } (Internal server error)
 */
const createFinalProduct = async (req: CustomRequest, res: Response) => {
  const uploadedPublicIds: string[] = [];
  try {
    const { productId, designApplications, productName, price, color } =
      req.body;
    console.log('createFinalProduct', req.body, req.files);

    // Find the associated product using the productId
    const productF = await product.findById(productId);
    if (!productF) {
      // Clean up uploaded images from Cloudinary
      await cleanupCloudinaryImages(uploadedPublicIds);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Process each design application
    const appliedDesigns = await Promise.all(
      designApplications.map(async (app: DesignApplication) => {
        const existingDesign = await design.findOne({
          designImage: {
            $elemMatch: { url: app.designImageUrl },
          },
        });

        if (!existingDesign) {
          logger.warn(`Design not found for URL: ${app.designImageUrl}`);
          return null;
        }

        return {
          // eslint-disable-line no-underscore-dangle
          designId: existingDesign._id,
          designerId: existingDesign.designer,
          position: app.position,
          appliedImage: {
            url: app.designImageUrl,
            filename: existingDesign.designImage[0].filename,
            position: app.position,
          },
        };
      }),
    );
    console.log('createFinalProduct2', appliedDesigns);
    // Filter out any null results (from designs not found)
    const validAppliedDesigns = appliedDesigns.filter(Boolean);
    if (validAppliedDesigns.length === 0) {
      // Clean up uploaded images from Cloudinary
      await cleanupCloudinaryImages(uploadedPublicIds);
      return res.status(400).json({ error: 'No valid designs provided' });
    }

    // Process uploaded images
    if (!req.files || req.files.length === 0) {
      // Clean up uploaded images from Cloudinary
      await cleanupCloudinaryImages(uploadedPublicIds);
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const processedImages = req.files.map((image, index) => {
      uploadedPublicIds.push(image.filename);
      return {
        url: image.path,
        filename: image.filename,
        position: index === 0 ? 'front' : 'back', // Assume first image is front, rest are back
      };
    });

    // Create a new FinalProduct instance
    // eslint-disable-next-line new-cap
    const newFinalProduct = new finalProduct({
      productName,
      price, // You may want to calculate this based on the base product and designs
      sales: 0,
      color,
      category: productF.category,
      baseProductImages: processedImages,
      appliedDesigns: validAppliedDesigns,
      productId,
    });

    // Save the FinalProduct instance to the database
    const savedFinalProduct = await newFinalProduct.save();

    // Populate the saved product with related data
    const populatedProduct = await finalProduct
      // eslint-disable-next-line no-underscore-dangle
      .findById(savedFinalProduct._id)
      .populate('productId', 'name')
      .populate('appliedDesigns.designId', 'title')
      .populate('appliedDesigns.designerId', 'artistName');

    // Format the product for the response
    const formattedProduct = formatFinalProduct(populatedProduct);

    // Respond with the created FinalProduct instance
    return res.status(201).json({ finalProduct: formattedProduct });
  } catch (error) {
    logger.error('Error creating final product:');
    logger.error(error);
    // Clean up uploaded images from Cloudinary
    await cleanupCloudinaryImages(uploadedPublicIds);

    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get all products by design
 * @route GET /finalproduct/products/design/:designId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with products or error
 *
 * @description Retrieves all final products that use a specific design.
 * @input
 *   - designId: string (in URL parameter)
 *   - category: string (optional query parameter)
 *   - color: string (optional query parameter)
 * @output
 *   - 200: {
 *       products: Array of product objects,
 *       designUrl: string
 *     }
 *   - 404: { error: string } (Design not found)
 *   - 500: { error: string } (Internal server error)
 */

const getAllProductsByDesign = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const { category, color } = req.query;

    // Find the design by designId
    const designF = await design.findById(designId);
    if (!designF) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Define the base query for finding products
    const productQuery: any = {
      'appliedDesigns.designId': designId,
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
      .populate('productId', 'name')
      .select(
        'price sales color category productId baseProductImages appliedDesigns',
      )
      .lean()
      .exec();

    const formattedProducts = products.map(formatFinalProduct);

    return res.status(200).json({
      products: formattedProducts,
      designUrl: designF.designImage[0].url,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get all products by designer
 * @route GET /finalproduct/products/designer/:designerId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with products or error
 *
 * @description Retrieves all final products created by a specific designer.
 * @input
 *   - designerId: string (in URL parameter)
 *   - category: string (optional query parameter)
 *   - color: string (optional query parameter)
 * @output
 *   - 200: {
 *       products: Array of product objects,
 *       designerName: string
 *     }
 *   - 404: { error: string } (Designer not found)
 *   - 500: { error: string } (Internal server error)
 */
const getAllProductsByDesigner = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;
    const { category, color } = req.query;

    // Find the designer by designerId
    const designerF = await designer.findById(designerId);
    if (!designerF) {
      return res.status(404).json({ error: 'Designer not found' });
    }

    // Define the base query for finding products
    const productQuery: any = {
      'appliedDesigns.designerId': designerId,
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
      .populate('productId', 'name')
      .populate('appliedDesigns.designId', 'title')
      .select(
        'price sales color category productId baseProductImages appliedDesigns',
      )
      .lean()
      .exec();

    const formattedProducts = products.map(formatFinalProduct);
    const groupedProducts = groupProductsByDesignAndCategory(formattedProducts);

    return res.status(200).json({
      products: groupedProducts,
      designerName: designerF.artistName || designerF.fullname,
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get categories without final products
 * @route POST /finalproduct/categories-without-products/:designerId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with categories or error
 *
 * @description Retrieves categories that don't have final products for a specific designer or design.
 * @input
 *   - designerId: string (in URL parameter)
 *   - designImageUrl: string (optional, in request body)
 * @output
 *   - 200: { categoriesWithoutProducts: Array of strings }
 *   - 404: { error: string } (Design not found, if designImageUrl is provided)
 *   - 500: { error: string } (Internal server error)
 */
const getCategoriesWithoutFinalProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const { designerId } = req.params;
    const { designImageUrl } = req.body;

    // console.log('getCategoriesWithoutFinalProducts', req.body, req.params);

    // Find all categories available in the system
    const allCategories = ['hoodie', 'shirt', 'Tshirt', 'cup'];

    // If req.body is empty or designImageUrl is empty, fetch categories without specifying designId
    if (!designImageUrl) {
      const categoriesWithProducts = await finalProduct
        .distinct('category', { 'appliedDesigns.designerId': designerId })
        .exec();

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

    console.log('Found design:', existingDesign);

    // If designImageUrl is not empty, proceed with the existing logic
    if (!existingDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // eslint-disable-next-line no-underscore-dangle
    const designId = existingDesign._id;

    // Find all categories associated with the designer's designs and this specific design
    const categoriesWithProducts = await finalProduct
      .distinct('category', {
        $and: [
          { 'appliedDesigns.designerId': designerId },
          { 'appliedDesigns.designId': designId },
        ],
      })
      .exec();

    // Calculate categories without final products
    const categoriesWithoutProducts = allCategories.filter(
      (category) => !categoriesWithProducts.includes(category),
    );

    return res.status(200).json({ categoriesWithoutProducts });
  } catch (error) {
    console.log('Error in getCategoriesWithoutFinalProducts', error);
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get paginated list of products
 * @route GET /finalproduct/products
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with products or error
 *
 * @description Retrieves a paginated list of final products, optionally filtered by category.
 * @input
 *   - page: number (optional query parameter, default: 1)
 *   - category: string (optional query parameter)
 * @output
 *   - 200: { products: Array of formatted product objects }
 *   - 500: { error: string } (Internal server error)
 */
const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const { category } = req.query;

    const query = category ? { category } : {};

    const products = await finalProduct
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .populate({
        path: 'productId',
        model: 'Product',
        select: 'name',
      })
      .populate({
        path: 'appliedDesigns.designId',
        model: 'Design',
        select: 'title',
      })
      .populate({
        path: 'appliedDesigns.designerId',
        model: 'Designer',
        select: 'artistName',
      })
      .lean()
      .exec();

    const formattedProducts = products.map(formatFinalProduct);

    const groupedProducts = groupProductsByDesignAndCategory(formattedProducts);

    return res
      .status(200)
      .json({ products: groupedProducts.slice(0, pageSize) });
  } catch (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// const getProductDetailSideView = async (req: Request, res: Response) => {
//   try {
//     const { finalProductId } = req.body;

//     // Fetch final product details
//     const finalProduct1 = await finalProduct
//       .findById(finalProductId)
//       .populate({
//         path: 'designerId',
//         model: 'Designer',
//       })
//       .exec();

//     if (!finalProduct1) {
//       return res.status(404).json({ error: 'Final Product not found' });
//     }
//     console.log(finalProduct1);

//     // Extract relevant information
//     const productDetails = {
//       prodImageUrl:
//         finalProduct1.prodImages.length > 0
//           ? finalProduct1.prodImages[0].url
//           : '',
//       price: finalProduct1.price,
//       color: finalProduct1.color,
//       designer: {
//         name: finalProduct1.designerId.artistName,
//         image: finalProduct1.designerId.profileImage
//           ? finalProduct1.designerId.profileImage.url
//           : '',

//         // Include any other relevant designer details
//       },
//     };

//     return res.status(200).json(productDetails);
//   } catch (error) {
//     logger.error('Error fetching product details:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

/**
 * Get single product data
 * @route GET /finalproduct/product/:finalProductId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with product details or error
 *
 * @description Retrieves detailed information about a specific final product.
 * @input
 *   - finalProductId: string (in URL parameter)
 * @output
 *   - 200: Formatted product data object
 *   - 404: { message: string } (Final product not found)
 *   - 500: { error: string } (Internal server error)
 */
const getSingleProductData = async (req: Request, res: Response) => {
  try {
    const { finalProductId } = req.params;

    const finalProductData = await finalProduct
      .findById(finalProductId)
      .populate({
        path: 'productId',
        select: 'name category',
      })
      .populate({
        path: 'appliedDesigns.designId',
        select: 'title',
      })
      .populate({
        path: 'appliedDesigns.designerId',
        select: 'artistName',
      })
      .lean()
      .exec();

    if (!finalProductData) {
      return res.status(404).json({ message: 'Final product not found' });
    }

    const formattedProduct = formatFinalProduct(finalProductData);

    return res.json(formattedProduct);
  } catch (error) {
    logger.error('Error fetching single product data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Get latest products
 * @route GET /finalproduct/latest
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with latest products or error
 *
 * @description Retrieves the 5 most recent final products based on creation timestamp.
 * @input None
 * @output
 *   - 200: { products: IFinalProductResponse[] }
 *   - 500: { error: string } (Internal server error)
 */
const getLatestProducts = async (req: Request, res: Response) => {
  try {
    const latestProducts = await finalProduct
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('productId', 'name')
      .populate('appliedDesigns.designId', 'title')
      .populate('appliedDesigns.designerId', 'artistName')
      .lean()
      .exec();

    const formattedProducts = latestProducts.map(formatFinalProduct);

    const groupedProducts = groupProductsByDesignAndCategory(formattedProducts);
    return res.status(200).json({ products: groupedProducts.slice(0, 5) });
  } catch (error) {
    logger.error('Error fetching latest products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// =========== code to create dummpy products ==============
/**
 * Create dummy products (for testing purposes)
 * @route POST /finalproduct/create-dummy-products
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response indicating success or error
 *
 * @description Creates a set of dummy final products for testing purposes.
 * @input None
 * @output
 *   - 200: { message: string } (Success message)
 *   - 500: { error: string } (Internal server error)
 */
const dummyProductsCreate = async (req: Request, res: Response) => {
  try {
    // Ensure we have a base product, a design, and a designer
    const baseProduct =
      (await product.findOne()) ||
      (await product.create({
        name: 'Classic T-Shirt',
        category: 'Tshirt',
        basePrice: 19.99,
        colors: ['white', 'black', 'red'],
        sizes: ['S', 'M', 'L', 'XL'],
      }));

    const dummyDesigner =
      (await designer.findOne()) ||
      (await designer.create({
        artistName: 'John Doe',
        description: 'A creative designer',
      }));

    const dummyDesign =
      (await design.findOne()) ||
      (await design.create({
        title: 'Abstract Art',
        description: 'A beautiful abstract design',
        designer: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
        designImage: [
          {
            url: 'https://example.com/abstract_art.jpg',
            filename: 'abstract_art.jpg',
          },
        ],
      }));

    const dummyFinalProducts = [
      {
        productName: 'White T-Shirt with Abstract Art',
        price: 29.99,
        sales: 0,
        color: 'white',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://example.com/tshirt_front_white.jpg',
            filename: 'tshirt_front_white.jpg',
            position: 'front',
          },
          {
            url: 'https://example.com/tshirt_back_white.jpg',
            filename: 'tshirt_back_white.jpg',
            position: 'back',
          },
        ],
        appliedDesigns: [
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'front',
            appliedImage: {
              url: 'https://example.com/applied_design_front.jpg',
              filename: 'applied_design_front.jpg',
              position: 'front',
            },
          },
        ],
        productId: baseProduct._id, // eslint-disable-line no-underscore-dangle
      },
      {
        productName: 'White T-Shirt with Abstract Art',
        price: 29.99,
        sales: 0,
        color: 'black',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://res.cloudinary.com/dmqzhgy0i/image/upload/v1716656679/Eye-Eye-Tee/fpluxubcjboxzpqibumj.jpg',
            filename: 'tshirt_front_black.jpg',
            position: 'front',
          },
          {
            url: 'https://example.com/tshirt_back_black.jpg',
            filename: 'tshirt_back_black.jpg',
            position: 'back',
          },
        ],
        appliedDesigns: [
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'back',
            appliedImage: {
              url: 'https://example.com/applied_design_back.jpg',
              filename: 'applied_design_back.jpg',
              position: 'back',
            },
          },
        ],
        productId: baseProduct._id, // eslint-disable-line no-underscore-dangle
      },
      {
        productName: 'White T-Shirt with Abstract Art',
        price: 29.99,
        sales: 0,
        color: 'red',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://example.com/tshirt_front_red.jpg',
            filename: 'tshirt_front_red.jpg',
            position: 'front',
          },
          {
            url: 'https://example.com/tshirt_back_red.jpg',
            filename: 'tshirt_back_red.jpg',
            position: 'back',
          },
        ],
        appliedDesigns: [
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'front',
            appliedImage: {
              url: 'https://example.com/applied_design_front_red.jpg',
              filename: 'applied_design_front_red.jpg',
              position: 'front',
            },
          },
        ],
        productId: baseProduct._id, // eslint-disable-line no-underscore-dangle
      },
      {
        productName: 'White T-Shirt with Abstract Art',
        price: 34.99,
        sales: 0,
        color: 'white',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://example.com/tshirt_front_white_premium.jpg',
            filename: 'tshirt_front_white_premium.jpg',
            position: 'front',
          },
          {
            url: 'https://example.com/tshirt_back_white_premium.jpg',
            filename: 'tshirt_back_white_premium.jpg',
            position: 'back',
          },
        ],
        appliedDesigns: [
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'front',
            appliedImage: {
              url: 'https://example.com/applied_design_front_premium.jpg',
              filename: 'applied_design_front_premium.jpg',
              position: 'front',
            },
          },
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'back',
            appliedImage: {
              url: 'https://example.com/applied_design_back_premium.jpg',
              filename: 'applied_design_back_premium.jpg',
              position: 'back',
            },
          },
        ],
        productId: baseProduct._id, // eslint-disable-line no-underscore-dangle
      },
      {
        productName: 'White T-Shirt with Abstract Art',
        price: 24.99,
        sales: 0,
        color: 'white',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://example.com/tshirt_front_white_basic.jpg',
            filename: 'tshirt_front_white_basic.jpg',
            position: 'front',
          },
          {
            url: 'https://example.com/tshirt_back_white_basic.jpg',
            filename: 'tshirt_back_white_basic.jpg',
            position: 'back',
          },
        ],
        appliedDesigns: [
          {
            designId: dummyDesign._id, // eslint-disable-line no-underscore-dangle
            designerId: dummyDesigner._id, // eslint-disable-line no-underscore-dangle
            position: 'front',
            appliedImage: {
              url: 'https://example.com/applied_design_front_basic.jpg',
              filename: 'applied_design_front_basic.jpg',
              position: 'front',
            },
          },
        ],
        productId: baseProduct._id, // eslint-disable-line no-underscore-dangle
      },
    ];
    await Promise.all(
      dummyFinalProducts.map((dummyProduct) =>
        finalProduct.create(dummyProduct),
      ),
    );

    logger.info('5 dummy final products created successfully!');
    return res.status(200).json({ message: 'Added to DB' });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createFinalProduct,
  getAllProductsByDesign,
  getAllProductsByDesigner,
  getSingleProductData,
  getCategoriesWithoutFinalProducts,
  getProducts,
  dummyProductsCreate,
  getLatestProducts,
  // getProductDetailSideView,
};
