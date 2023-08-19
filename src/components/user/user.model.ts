import mongoose, { Schema } from 'mongoose';
import { IUser } from './user.interface';

const UserSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: { type: String, required: true },

  following: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Designer',
    },
  ],
});

const user = mongoose.model<IUser>('Designer', UserSchema);
// eslint-disable-next-line import/prefer-default-export
export { user };
