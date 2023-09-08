// to be added purchases field

import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  username: String;
  email: String;
  password?: String;
  following?: [{ type: mongoose.Schema.Types.ObjectId }];
  googleId: String;
  isDesigner: Boolean;
}
