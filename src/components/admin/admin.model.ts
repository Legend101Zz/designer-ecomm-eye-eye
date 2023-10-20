import mongoose, { Schema } from 'mongoose';
import { IAdmin } from './admin.interface';

const AdminSchema: Schema<IAdmin> = new Schema({
  email: { type: String },
  password: { type: String },
});

const admin = mongoose.model<IAdmin>('Design', AdminSchema);
// eslint-disable-next-line import/prefer-default-export
export { admin };
