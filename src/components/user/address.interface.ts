import mongoose from 'mongoose';

export interface IAddress {
  _id: string;
  username: string;
  user_id: { type: mongoose.Schema.Types.ObjectId };
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
}

export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}
