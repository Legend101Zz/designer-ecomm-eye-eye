import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IDesigner } from './designer.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const SettingsSchema = new Schema({
  isPrivate: { type: Boolean, default: false },
  showDesigns: {
    enabled: { type: Boolean, default: true },
    designIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Design',
      },
    ],
  },
  showFullName: { type: Boolean, default: true },
  showPhone: { type: Boolean, default: true },
  showDescription: { type: Boolean, default: true },
  showCoverPhoto: { type: Boolean, default: true },
  showProfilePhoto: { type: Boolean, default: true },
  socialMedia: [{ type: String }],
  portfolioLinks: [{ type: String }],
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
  settings: SettingsSchema,
});

const designer = mongoose.model<IDesigner>('Designer', DesignerSchema);
// eslint-disable-next-line import/prefer-default-export
export { designer };
