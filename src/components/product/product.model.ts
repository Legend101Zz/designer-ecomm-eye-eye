import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { Iproduct } from './product.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const ProductSchema: Schema<Iproduct> = new Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  color: { type: String, required: true },
  category: { type: String, required: true },

  image: [ImageSchema],
});

const product = mongoose.model<Iproduct>('Product', ProductSchema);
// eslint-disable-next-line import/prefer-default-export
export { product };
