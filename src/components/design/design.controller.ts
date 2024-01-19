import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { design } from './design.model';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

const showDesigns = async (req: Request, res: Response) => {
  try {
    const verifiedDesigns = await design
      .find() // Filter by designs with isVerified set to true
      .populate('product', 'name')
      .populate('designer', 'legal_first_name legal_last_name')
      .exec();

    return res.status(200).json(verifiedDesigns);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// controller for updating a design
const updateDesign = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params; // Extract design ID from request params
    const { title, description, productIds } = req.body;

    // Find the design by ID
    const existingDesign = await design.findById(designId);

    if (!existingDesign) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Update the design fields if provided in the request
    if (title) {
      existingDesign.title = title;
    }
    if (description) {
      existingDesign.description = description;
    }
    if (productIds) {
      // Check if the products exist
      const existingProducts = await product.find({ _id: { $in: productIds } });

      if (existingProducts.length !== productIds.length) {
        return res.status(404).json({ message: 'Some products not found' });
      }

      existingDesign.product = productIds;
    }

    // Save the updated design
    const updatedDesign = await existingDesign.save();

    return res.status(200).json(updatedDesign);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getDesignerDesigns = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    const designs = await design
      .find({ designer: designerId })
      .populate('designer', 'name'); // Assuming the designer model has a 'name' field

    if (!designs || designs.length === 0) {
      return res
        .status(404)
        .json({ error: 'Designer not found or has no designs.' });
    }

    // Extract relevant information from designs
    const formattedDesigns = designs.map((design1) => ({
      title: design1.title,
      description: design1.description,
      designer: design1.designer.name, // Assuming the designer model has a 'name' field
      designImages: design1.designImage.map((image) => ({
        url: image.url,
        filename: image.filename,
      })),
    }));

    return res.json(formattedDesigns);
  } catch (error) {
    logger.error('Error fetching designs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const addProductsToDesign = async (req: CustomRequest, res: Response) => {
  try {
    const { designImageUrl } = req.body; // Assuming designId is passed as a parameter in the URL
    console.log('in design', designImageUrl, req.body, req.files);
    const existingDesign = await design.findOne({
      designImage: {
        $elemMatch: { url: designImageUrl },
      },
    });
    if (!existingDesign) {
      return res.status(404).json({ message: 'Design not found' });
    }

    if (req.files) {
      // Extract images from req.files
      const images = req.files.reduce((acc, file: any) => {
        // Parse productId from the filename
        const productIdMatch = file.originalname.match(/product_(.+)_image/);
        const productId = productIdMatch ? productIdMatch[1] : null;

        // Find the product in the existing images array or create a new one
        const productIndex = acc.findIndex(
          (product1) => product1.productId === productId,
        );
        if (productIndex !== -1) {
          // // If the product already exists, add the image to it
          // // eslint-disable-next-line security/detect-object-injection
          // acc[productIndex].images.push({
          //   url: file.path,
          //   filename: file.filename,
          // });
          // ============NEW IMPLEMENTATION ============
          // If the product already exists, skip adding it
          return acc;
        }
        if (productIndex === -1) {
          // If the product does not exist, create a new product with the image
          acc.push({
            productId,
            images: [
              {
                url: file.path,
                filename: file.filename,
              },
            ],
          });

          return acc;
        }
        return acc;
      }, []);
      // Add products to the design
      existingDesign.product.push(...images);
      // Save the updated design
      const updatedDesign = await existingDesign.save();

      return res.status(200).json({
        message: 'Products added to design successfully',
        updatedDesign,
      });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { showDesigns, updateDesign, addProductsToDesign };
