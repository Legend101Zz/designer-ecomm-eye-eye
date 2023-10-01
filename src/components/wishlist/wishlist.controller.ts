import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { wishlist } from './wishlist.model';

const addToWishList = async (req: Request, res: Response) => {
  const user = req.body.userId;
  const { productIds } = req.body; // Change 'products' to 'productIds'
  try {
    const wish = await wishlist.findOne({ userId: user });

    if (wish) {
      // Push the productIds to the 'products' array
      await wishlist.updateOne(
        // eslint-disable-next-line no-underscore-dangle
        { _id: wish._id },
        { $push: { products: productIds } },
      );
      return res
        .status(200)
        .json({ message: 'Added Item to wishlist successfully' });
    }
    // eslint-disable-next-line new-cap
    const newWish = new wishlist({ userId: user, products: productIds }); // Change 'products' to 'productIds'
    await newWish.save();
    return res.status(200).json({
      message:
        'Created Wishlist for user and Added Item to wishlist successfully',
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { addToWishList };
