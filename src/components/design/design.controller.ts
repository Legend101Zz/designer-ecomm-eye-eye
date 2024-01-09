import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { design } from './design.model';

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

    res.json(formattedDesigns);
  } catch (error) {
    logger.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { showDesigns, updateDesign };
