/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { Iproduct, Color } from './product.interface';

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
  color: [{ type: String, required: true }],
  category: {
    type: String,
    required: true,
  },
  image: [ImageSchema],
});

// eslint-disable-next-line func-names
ProductSchema.pre('save', function (next) {
  // Access the category field of the current document
  const { category } = this;

  // Check if the category is 'shirt'
  if (category === 'shirt' || category === 'Tshirt') {
    this.color = Color.red;
  } else {
    this.color = undefined; // Remove the 'color' field
  }

  // Call next to continue with the save operation
  next();
});

const product = mongoose.model<Iproduct>('Product', ProductSchema);

// eslint-disable-next-line import/prefer-default-export
export { product };
