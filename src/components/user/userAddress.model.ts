import mongoose, { Schema } from 'mongoose';
import { IAddress, AddressType } from './address.interface';

const AddressSchema: Schema<IAddress> = new Schema(
  {
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String,
    address_type: {
      type: String,
      enum: Object.values(AddressType),
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

const address = mongoose.model<IAddress>('Address', AddressSchema);
// eslint-disable-next-line import/prefer-default-export
export { address };
