import mongoose from 'mongoose';

/**
 * Address Types
 * @enum {string}
 */
export enum AddressType {
  HOME = 'home', // Residential address
  WORK = 'work', // Work/Office address
  OTHER = 'other', // Any other type of address
}

/**
 * Address Interface
 * Represents a user's address in the system
 */
export interface IAddress {
  /** MongoDB document id */
  _id: string;

  /** Reference to the user who owns this address */
  userId: mongoose.Schema.Types.ObjectId;

  /** Primary address line */
  addressLine1: string;

  /** Secondary address line (optional) */
  addressLine2?: string;

  /** City name */
  city: string;

  /** State/Province/Region */
  state: string;

  /** Postal/ZIP code */
  postalCode: string;

  /** Country name */
  country: string;

  /** Type of address */
  addressType: AddressType;

  /** Whether this is the default address */
  isDefault: boolean;

  /** Contact phone number for this address */
  phone?: string;

  /** Custom label for the address */
  label?: string;

  /** Address creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
