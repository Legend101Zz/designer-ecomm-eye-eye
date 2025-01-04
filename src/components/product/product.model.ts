import { Schema, model } from 'mongoose';
import {
  ProductDocument,
  ProductType,
  ClothingCategory,
  AccessoryCategory,
  Color,
  IProductImage,
  Gender,
  Size,
} from './product.interface';

const ImageSchema = new Schema<IProductImage>({
  url: String,
  filename: String,
  position: {
    type: String,
    enum: ['front', 'back', 'side', 'detail'],
    required: true,
  },
  color: {
    type: String,
    enum: Object.values(Color),
    required: true,
  },
  variant: String,
});

const DeviceVariantSchema = new Schema({
  deviceBrand: {
    type: String,
    required: true,
  },
  deviceModel: {
    type: String,
    required: true,
  },
  dimensions: {
    width: Number,
    height: Number,
  },
});

const ProductSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    productType: {
      type: String,
      enum: Object.values(ProductType),
      required: true,
    },
    category: {
      type: String,
      required: true,
      validate: {
        validator(this: ProductDocument, value: string) {
          if (this.productType === ProductType.CLOTHING) {
            return Object.values(ClothingCategory).includes(
              value as ClothingCategory,
            );
          }
          return Object.values(AccessoryCategory).includes(
            value as AccessoryCategory,
          );
        },
        message: 'Invalid category for product type',
      },
    },
    colors: {
      type: [
        {
          type: String,
          enum: Object.values(Color),
        },
      ],
      validate: {
        validator(v: Color[]) {
          return v && v.length > 0;
        },
        message: 'At least one color is required',
      },
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [ImageSchema],
    basePrice: {
      type: Number,
      required: true,
    },
    sizes: {
      type: [
        {
          type: String,
          enum: Object.values(Size),
        },
      ],
      validate: {
        validator(this: ProductDocument, v: Size[]) {
          if (this.productType === ProductType.CLOTHING) {
            return v && v.length > 0;
          }
          return true;
        },
        message: 'Sizes are required for clothing products',
      },
    },
    gender: {
      type: [
        {
          type: String,
          enum: Object.values(Gender),
        },
      ],
      validate: {
        validator(this: ProductDocument, v: Gender[]) {
          if (this.productType === ProductType.CLOTHING) {
            return v && v.length > 0;
          }
          return true;
        },
        message: 'Gender is required for clothing products',
      },
    },
    measurements: {
      type: Map,
      of: {
        chest: Number,
        length: Number,
        sleeve: Number,
      },
    },
    deviceVariants: {
      type: [DeviceVariantSchema],
      validate: {
        validator(this: ProductDocument, v: any[]) {
          if (
            this.category === AccessoryCategory.PHONE_CASE ||
            this.category === AccessoryCategory.LAPTOP_CASE
          ) {
            return v && v.length > 0;
          }
          return true;
        },
        message: 'Device variants are required for case products',
      },
    },
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
    },
  },
  { timestamps: true },
);

// Add middleware for validation
// eslint-disable-next-line func-names, consistent-return
ProductSchema.pre('save', function (this: ProductDocument, next) {
  const requiredImages = this.calculateRequiredImages();
  if (this.images.length !== requiredImages) {
    return next(
      new Error(`Must provide ${requiredImages} images for all variations`),
    );
  }
  next();
});

// Add method to calculate required images
// eslint-disable-next-line func-names
ProductSchema.methods.calculateRequiredImages = function (
  this: ProductDocument,
): number {
  if (this.productType === ProductType.CLOTHING) {
    return this.colors.length * (this.gender?.length || 0) * 2;
  }
  if (
    this.category === AccessoryCategory.PHONE_CASE ||
    this.category === AccessoryCategory.LAPTOP_CASE
  ) {
    return this.colors.length * (this.deviceVariants?.length || 0) * 2;
  }
  return this.colors.length * (this.category === AccessoryCategory.MUG ? 2 : 1);
};

const product = model<ProductDocument>('Product', ProductSchema);

// eslint-disable-next-line import/prefer-default-export
export { product };
