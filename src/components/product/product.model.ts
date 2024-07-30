/* eslint-disable no-unused-vars */
import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { Iproduct, Color, Category, Size, Gender } from './product.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
  position: {
    type: String,
    enum: ['front', 'back'],
    required: true,
  },
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
  color: [{ type: String, enum: Object.values(Color) }],
  category: {
    type: String,
    required: true,
    enum: Object.values(Category),
  },
  image: [ImageSchema],
  sizes: {
    type: [String],
    enum: Object.values(Size),
    validate: {
      validator(v: string[]) {
        if (['shirt', 'Tshirt', 'hoodie'].includes(this.category)) {
          return v && v.length > 0;
        }
        return true;
      },
      message:
        'Sizes field is required for shirt, Tshirt, and hoodie categories',
    },
  },
  basePrice: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    default: Gender.unisex,
  },
});

// eslint-disable-next-line func-names, consistent-return
ProductSchema.pre('save', function (next) {
  const { category, color, sizes } = this;

  if (['shirt', 'Tshirt', 'hoodie'].includes(category)) {
    // Ensure color field is optional and can be undefined
    if (!color || color.length === 0) {
      this.color = [];
    }
    // Ensure sizes field is present
    if (!sizes || sizes.length === 0) {
      return next(
        new Error(
          'Sizes field is required for shirt, Tshirt, and hoodie categories',
        ),
      );
    }
  } else {
    // Remove the sizes field if the category is not 'shirt', 'Tshirt', or 'hoodie'
    this.sizes = [];
  }

  // Call next to continue with the save operation
  next();
});

const product = mongoose.model<Iproduct>('Product', ProductSchema);

// eslint-disable-next-line import/prefer-default-export
export { product };
