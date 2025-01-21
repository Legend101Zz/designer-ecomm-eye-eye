import mongoose, { Schema } from 'mongoose';
import { IUser } from './user.interface';

const UserSchema: Schema<IUser> = new Schema(
  {
    // Authentication & Identity
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Profile Information
    phone: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    googleId: {
      type: String,
    },

    // Relationships & References
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Designer',
      },
    ],
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Address',
      },
    ],

    // Designer Status
    isDesigner: {
      type: Boolean,
      default: false,
    },
    DesignerId: {
      type: Schema.Types.ObjectId,
      ref: 'Designer',
    },

    // Shopping Cart
    cart: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'FinalProduct',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
    // Add indexes for frequently queried fields
    indexes: [{ email: 1, unique: true }, { username: 1 }, { isDesigner: 1 }],
  },
);

// Add a compound index for cart querying
UserSchema.index({ 'cart.product': 1 });

const user = mongoose.model<IUser>('User', UserSchema);

// eslint-disable-next-line import/prefer-default-export
export { user };
