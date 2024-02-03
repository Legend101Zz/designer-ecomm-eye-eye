/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IfinalProduct } from './finalprod.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const FinalProductSchema: Schema<IfinalProduct> = new Schema({
  price: {
    type: Number,
    required: true,
  },
  sales: {
    type: Number,
    required: true,
  },
  color: { type: String, required: true },
  category: {
    type: String,
    required: true,
  },
  prodImages: [ImageSchema],
  designId: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
});

const finalProduct = mongoose.model<IfinalProduct>(
  'FinalProduct',
  FinalProductSchema,
);

// eslint-disable-next-line import/prefer-default-export
export { finalProduct };
