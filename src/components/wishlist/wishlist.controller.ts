import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { wishlist } from './wishlist.model';

const addToWishList = async (req: Request, res: Response) => {
  const user = req.body.userId;
  const { productIds } = req.body; // Change 'products' to 'productIds'
  try {
    const wish = await wishlist.findOne({ userId: user });

    if (wish) {
      // Check if any of the productIds already exist in the 'products' array
      const existingProducts = wish.products.filter((productId) =>
        productIds.includes(productId),
      );

      if (existingProducts.length > 0) {
        return res.status(400).json({
          message: 'Some of the products are already in the wishlist',
          existingProducts,
        });
      }

      // Add only the unique productIds to the 'products' array
      await wishlist.updateOne(
        // eslint-disable-next-line no-underscore-dangle
        { _id: wish._id },
        { $push: { products: { $each: productIds } } },
      );

      return res
        .status(200)
        .json({ message: 'Added Item(s) to wishlist successfully' });
    }

    // eslint-disable-next-line new-cap
    const newWish = new wishlist({ userId: user, products: productIds }); // Change 'products' to 'productIds'
    await newWish.save();
    return res.status(200).json({
      message:
        'Created Wishlist for user and Added Item(s) to wishlist successfully',
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { addToWishList };
