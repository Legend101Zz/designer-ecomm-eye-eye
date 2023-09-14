import mongoose, { Schema } from 'mongoose';
import { IUser } from './user.interface';

const UserSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
  },
  password: { type: String },

  googleId: { type: String },

  phone: { type: String },

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
  isDesigner: { type: Boolean, default: false },
  DesignerId: {
    type: Schema.Types.ObjectId,
    ref: 'Designer',
  },
});

const user = mongoose.model<IUser>('User', UserSchema);
// eslint-disable-next-line import/prefer-default-export
export { user };
