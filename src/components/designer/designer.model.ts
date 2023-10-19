import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IDesigner } from './designer.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const DesignerSchema: Schema<IDesigner> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  profileImage: ImageSchema,
  coverImage: ImageSchema,
  isApproved: { type: Boolean, default: false },
  Designs: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Design',
    },
  ],
  legal_first_name: String,
  legal_last_name: String,
  fullname: String,
  artistName: String,
  description: String,
  socialMedia: [{ type: String }],
  phone: Number,
  portfolioLinks: [{ type: String }],
  cvLinks: [{ type: String }],
  legal_address: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Address',
    },
  ],
  panCard: ImageSchema,
  panCardNumber: String,
});

const designer = mongoose.model<IDesigner>('Designer', DesignerSchema);
// eslint-disable-next-line import/prefer-default-export
export { designer };
