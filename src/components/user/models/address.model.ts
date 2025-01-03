import mongoose, { Schema, Model } from 'mongoose';
import validator from 'validator';
import { IAddress, AddressType } from '../interfaces/address.interface';

/**
 * Address Schema
 */
const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [100, 'Address line 1 cannot exceed 100 characters'],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [100, 'Address line 2 cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          // Basic postal code validation - can be customized based on country
          return /^[0-9]{6}$/.test(v);
        },
        message: 'Invalid postal code format',
      },
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country name cannot exceed 50 characters'],
    },
    addressType: {
      type: String,
      enum: Object.values(AddressType),
      required: [true, 'Address type is required'],
      default: AddressType.HOME,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty phone
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Invalid phone number format',
      },
    },
    label: {
      type: String,
      trim: true,
      maxlength: [30, 'Label cannot exceed 30 characters'],
    },
  },
  {
    timestamps: true,
  },
);

// Create compound index for userId and addressType
AddressSchema.index({ userId: 1, addressType: 1 });

// Pre-save middleware to ensure only one default address
AddressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    // Find and unset any other default addresses for this user
    await this.constructor.updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
        isDefault: true,
      },
      { $set: { isDefault: false } },
    );
  }
  next();
});

// Create and export the model
export const Address: Model<IAddress> = mongoose.model<IAddress>(
  'Address',
  AddressSchema,
);
