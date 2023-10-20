import mongoose, { Schema } from 'mongoose';
import { IAdmin } from './admin.interface';

const AdminSchema: Schema<IAdmin> = new Schema({
  email: { type: String },
  password: { type: String },
  isAdmin: { type: Boolean, default: true },
});

const admin = mongoose.model<IAdmin>('Admin', AdminSchema);
// eslint-disable-next-line import/prefer-default-export
export { admin };
