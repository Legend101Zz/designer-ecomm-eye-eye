import mongoose from 'mongoose';

/**
 * User Account Status
 * @enum {string}
 */
export enum UserStatus {
  ACTIVE = 'active', // User account is active and can perform all actions
  PENDING = 'pending', // User account is created but email not verified
  INACTIVE = 'inactive', // User account is temporarily deactivated
  SUSPENDED = 'suspended', // User account is suspended due to violations
}

/**
 * Cart Item Interface
 * Represents an item in the user's shopping cart
 */
export interface ICartItem {
  /** Reference to the product in the cart */
  product: mongoose.Schema.Types.ObjectId;
  /** Quantity of the product */
  quantity: number;
  /** Size of the product (if applicable) */
  size?: string;
  /** Date when the item was added to cart */
  addedAt: Date;
}

/**
 * Profile Image Interface
 * Represents user's profile image data
 */
export interface IProfileImage {
  /** URL of the stored image */
  url: string;
  /** Filename in the storage system */
  filename: string;
}

/**
 * Main User Interface
 * Represents the user document structure in MongoDB
 */
export interface IUser {
  /** MongoDB document id */
  _id: string;

  /** User's chosen username */
  username: string;

  /** User's email address */
  email: string;

  /** Hashed password */
  password: string;

  /** Flag indicating if email is verified */
  isEmailVerified: boolean;

  /** Token for email verification */
  verificationToken?: string;

  /** Expiry date for verification token */
  verificationTokenExpiry?: Date;

  /** Token for password reset */
  resetPasswordToken?: string;

  /** Expiry date for password reset token */
  resetPasswordExpiry?: Date;

  /** Array of designer IDs that the user follows */
  following: mongoose.Schema.Types.ObjectId[];

  /** Flag indicating if user is a designer */
  isDesigner: boolean;

  /** Array of user's address IDs */
  addresses: mongoose.Schema.Types.ObjectId[];

  /** User's phone number */
  phone?: string;

  /** User's full name */
  name?: string;

  /** User's profile description */
  description?: string;

  /** Reference to designer profile if user is a designer */
  designerId?: mongoose.Schema.Types.ObjectId;

  /** Array of items in user's shopping cart */
  cart: ICartItem[];

  /** User's profile image */
  profileImage?: IProfileImage;

  /** Timestamp of user's last login */
  lastLogin?: Date;

  /** Current status of the user account */
  status: UserStatus;

  /** Account creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
