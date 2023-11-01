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

// eslint-disable-next-line import/prefer-default-export
export { showDesigns, updateDesign };
