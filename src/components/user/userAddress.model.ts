import mongoose, { Schema } from 'mongoose';
import { IAddress } from './address.interface';

const AddressSchema: Schema<IAddress> = new Schema({
  address_line1: String,
  address_line2: String,
  city: String,
  state: String,
  postal_code: String,
  country: String,
  address_type: String,
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

const address = mongoose.model<IAddress>('Address', AddressSchema);
// eslint-disable-next-line import/prefer-default-export
export { address };
