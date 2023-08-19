import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IDesign } from './design.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const DesignSchema: Schema<IDesign> = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: { type: String, required: true },
  designImage: [ImageSchema],
  designer: {
    type: Schema.Types.ObjectId,
    ref: 'Designer',
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
});

const design = mongoose.model<IDesign>('Design', DesignSchema);
// eslint-disable-next-line import/prefer-default-export
export { design };
