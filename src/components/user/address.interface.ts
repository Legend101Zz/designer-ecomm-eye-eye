import mongoose from 'mongoose';

export interface IAddress {
  _id: string;
  username: String;
  user_id: { type: mongoose.Schema.Types.ObjectId };
  address_line1: String;
  address_line2: String;
  city: String;
  postal_code: String;
  country: String;
  address_type: String;
}
