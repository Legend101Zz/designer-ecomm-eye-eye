import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { design } from './design.model';

const showDesigns = async (req: Request, res: Response) => {
  try {
    const verifiedDesigns = await design
      .find({ isVerified: true }) // Filter by designs with isVerified set to true
      .populate('product', 'name')
      .populate('designer', 'legal_first_name legal_last_name');

    return res.status(200).json(verifiedDesigns);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { showDesigns };
