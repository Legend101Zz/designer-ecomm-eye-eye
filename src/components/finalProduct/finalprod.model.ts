/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IfinalProduct, IDesignApplication } from './finalprod.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
  position: {
    type: String,
    enum: ['front', 'back'],
    required: true,
  },
});

const DesignApplicationSchema: Schema<IDesignApplication> = new Schema({
  designId: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
    required: true,
  },
  designerId: {
    type: Schema.Types.ObjectId,
    ref: 'Designer',
    required: true,
  },
  position: {
    type: String,
    enum: ['front', 'back'],
    required: true,
  },
  appliedImage: ImageSchema,
});

const FinalProductSchema: Schema<IfinalProduct> = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 1000,
    },
    sales: {
      type: Number,
      required: true,
      default: 0,
    },
    color: { type: String, required: true },
    category: {
      type: String,
      required: true,
    },
    baseProductImages: [ImageSchema],
    appliedDesigns: [DesignApplicationSchema],
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true },
);

const finalProduct = mongoose.model<IfinalProduct>(
  'FinalProduct',
  FinalProductSchema,
);

// eslint-disable-next-line import/prefer-default-export
export { finalProduct };
