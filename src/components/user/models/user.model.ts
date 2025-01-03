import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import {
  IUser,
  UserStatus,
  ICartItem,
  IProfileImage,
} from '../interfaces/user.interface';

/**
 * Schema for cart items within the user document
 */
const CartItemSchema = new Schema<ICartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'FinalProduct',
    required: [true, 'Product ID is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  size: {
    type: String,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Schema for profile image
 */
const ProfileImageSchema = new Schema<IProfileImage>({
  url: {
    type: String,
    required: true,
    trim: true,
  },
  filename: {
    type: String,
    required: true,
    trim: true,
  },
});

/**
 * Main User Schema
 */
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Designer',
      },
    ],
    isDesigner: {
      type: Boolean,
      default: false,
    },
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Address',
      },
    ],
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true; // Allow empty phone
          return validator.isMobilePhone(value);
        },
        message: 'Invalid phone number format',
      },
    },
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    designerId: {
      type: Schema.Types.ObjectId,
      ref: 'Designer',
    },
    cart: [CartItemSchema],
    profileImage: ProfileImageSchema,
    lastLogin: Date,
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ resetPasswordToken: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if account is active
UserSchema.methods.isActive = function (): boolean {
  return this.status === UserStatus.ACTIVE;
};

// Virtual for cart item count
UserSchema.virtual('cartItemCount').get(function () {
  return this.cart.reduce((total, item) => total + item.quantity, 0);
});

// Create and export the model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
