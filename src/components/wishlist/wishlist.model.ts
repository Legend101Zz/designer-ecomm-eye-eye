import mongoose, { Schema } from 'mongoose';
import { IWishlist } from './wishlist.interface';

const WishlistSchema: Schema<IWishlist> = new Schema({
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Design',
    },
  ],

  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Designer',
  },
});

const wishlist = mongoose.model<IWishlist>('Wishlist', WishlistSchema);
// eslint-disable-next-line import/prefer-default-export
export { wishlist };
