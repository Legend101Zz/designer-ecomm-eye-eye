import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { design } from '@components/design/design.model';
import { designer } from '@components/designer/designer.model';
import { IFinalProductResponse } from './finalprod.interface';
import { finalProduct } from './finalprod.model';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

interface DesignApplication {
  designImageUrl: string;
  position: 'front' | 'back';
}

const formatFinalProduct = (product2: any): IFinalProductResponse => {
  const mainImage =
    product2.baseProductImages.find((img: any) => img.position === 'front') ||
    product2.baseProductImages[0];

  return {
    productId: product2._id.toString(), // eslint-disable-line no-underscore-dangle
    baseProductName: product2.productId
      ? product2.productId.name
      : 'Unknown Product',
    mainImageUrl: mainImage ? mainImage.url : '',
    otherImages: product2.baseProductImages
      .filter((img) => img !== mainImage)
      .map((img) => img.url),
    price: product2.price,
    category: product2.category,
    color: product2.color,
    sales: product2.sales,
    designs: product2.appliedDesigns.map((design2) => ({
      designName: design2.designId ? design2.designId.title : 'Unknown Design',
      designerName: design2.designerId
        ? design2.designerId.artistName
        : 'Unknown Designer',
      position: design2.position,
      appliedImageUrl: design2.appliedImage.url,
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

// NOTE WILL NEED TO CHANGE TO STORE IN CLOUDINARY
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
 * @output
 *   - 201: { finalProduct: object } (Created final product details)
 *   - 400: { error: string } (No valid designs provided)
 *   - 404: { error: string } (Product or Design not found)
 *   - 500: { error: string } (Internal server error)
 */

const createFinalProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { productId, designApplications } = req.body;
    // console.log('createFinalProduct', req.body, req.files);

    // Find the associated product using the productId
    const productF = await product.findById(productId);

    if (!productF) {
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
          designId: existingDesign._id, // eslint-disable-line no-underscore-dangle
          designerId: existingDesign.designer,
          position: app.position,
          appliedImage: {
            url: app.designImageUrl,
            filename: existingDesign.designImage[0].filename,
          },
        };
      }),
    );

    // Filter out any null results (from designs not found)
    const validAppliedDesigns = appliedDesigns.filter(Boolean);

    if (validAppliedDesigns.length === 0) {
      return res.status(400).json({ error: 'No valid designs provided' });
    }

    // Create a new FinalProduct instance
    // eslint-disable-next-line new-cap
    const newFinalProduct = new finalProduct({
      price: 1000, // will change this
      sales: 0,
      color: productF.color[0],
      category: productF.category,
      baseProductImages: productF.image, // Use the base product images
      appliedDesigns: validAppliedDesigns,
      productId,
    });

    // Save the FinalProduct instance to the database
    const savedFinalProduct = await newFinalProduct.save();

    // Respond with the created FinalProduct instance
    return res.status(201).json({ finalProduct: savedFinalProduct });
  } catch (error) {
    logger.error('Error creating final product:', error);
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

    // Format the products data
    const formattedProducts = products.map((product2) => {
      const relevantDesign = product2.appliedDesigns.find(
        (d) => d.designId.toString() === designId,
      );
      return {
        finalProductId: product2._id, // eslint-disable-line no-underscore-dangle
        baseProductName: (product2.productId as any).name,
        price: product2.price,
        sales: product2.sales,
        color: product2.color,
        category: product2.category,
        mainImage: product2.baseProductImages[0]?.url || '',
        designApplication: {
          position: relevantDesign?.position,
          appliedImageUrl: relevantDesign?.appliedImage.url,
        },
      };
    });

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

    // Format the products data
    const formattedProducts = products.map((product2) => {
      const designerDesigns = product2.appliedDesigns.filter(
        (d) => d.designerId.toString() === designerId,
      );
      return {
        finalProductId: product2._id, // eslint-disable-line no-underscore-dangle
        baseProductName: (product2.productId as any).name,
        price: product2.price,
        sales: product2.sales,
        color: product2.color,
        category: product2.category,
        mainImage: product2.baseProductImages[0]?.url || '',
        designApplications: designerDesigns.map((design2) => ({
          designName: (design2.designId as any).title,
          position: design2.position,
          appliedImageUrl: design2.appliedImage.url,
        })),
      };
    });

    return res.status(200).json({
      products: formattedProducts,
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

    console.log('getCategoriesWithoutFinalProducts', req.body, req.params);

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

    const formattedProducts = products.map((product_2) => {
      const mainImage =
        product_2.baseProductImages.find((img) => img.position === 'front') ||
        product_2.baseProductImages[0];

      return {
        productId: product_2._id, // eslint-disable-line no-underscore-dangle
        baseProductName: product_2.productId
          ? (product_2.productId as any).name
          : 'Unknown Product',
        mainImageUrl: mainImage ? mainImage.url : '',
        otherImages: product_2.baseProductImages
          .filter((img) => img !== mainImage)
          .map((img) => img.url),
        price: product_2.price,
        category: product_2.category,
        color: product_2.color,
        designs: product_2.appliedDesigns.map((design_2) => ({
          designName: design_2.designId
            ? (design_2.designId as any).title
            : 'Unknown Design',
          designerName: design_2.designerId
            ? (design_2.designerId as any).artistName
            : 'Unknown Designer',
          position: design_2.position,
          appliedImageUrl: design_2.appliedImage.url,
        })),
      };
    });

    return res.status(200).json({ products: formattedProducts });
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

    // Extract base product images
    const baseProductImages = finalProductData.baseProductImages.map(
      (img) => img.url,
    );
    const mainImageUrl =
      baseProductImages.length > 0 ? baseProductImages[0] : '';
    const otherImages = baseProductImages.slice(1);

    // Extract applied designs information
    const appliedDesigns = finalProductData.appliedDesigns.map((design_2) => ({
      designName: design_2.designId // eslint-disable-line no-underscore-dangle
        ? (design_2.designId as any).title
        : 'Unknown Design',
      designerName: design_2.designerId
        ? (design_2.designerId as any).artistName
        : 'Unknown Designer',
      position: design_2.position,
      appliedImageUrl: design_2.appliedImage ? design_2.appliedImage.url : '',
    }));

    // Construct the final response
    const formattedData = {
      productId: finalProductData._id, // eslint-disable-line no-underscore-dangle
      baseProductName: finalProductData.productId
        ? (finalProductData.productId as any).name
        : 'Unknown Product',
      category: finalProductData.category,
      price: finalProductData.price,
      color: finalProductData.color,
      mainImageUrl,
      otherImages,
      baseProductImages,
      appliedDesigns,
    };

    return res.json(formattedData);
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

    const formattedProducts: IFinalProductResponse[] =
      latestProducts.map(formatFinalProduct);

    return res.status(200).json({ products: formattedProducts });
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
        price: 29.99,
        sales: 0,
        color: 'black',
        category: 'Tshirt',
        baseProductImages: [
          {
            url: 'https://example.com/tshirt_front_black.jpg',
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
  // getProductDetailSideView,
};
