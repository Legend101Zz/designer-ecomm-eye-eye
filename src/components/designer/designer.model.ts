import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IDesigner } from './designer.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const DesignerSchema: Schema<IDesigner> = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: { type: String, required: true },
  profileImage: ImageSchema,
  Designs: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Design',
    },
  ],
});

const designer = mongoose.model<IDesigner>('Designer', DesignerSchema);
// eslint-disable-next-line import/prefer-default-export
export { designer };
