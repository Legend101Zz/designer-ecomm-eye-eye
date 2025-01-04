/* eslint-disable func-names */
import mongoose, { Schema, Document } from 'mongoose';
import {
  IFinalProduct,
  IDesignApplication,
  IProductVariant,
  IDesignGroup,
} from './finalprod.interface';
import { Color, Gender, Size } from '../product/product.interface';

const DesignApplicationSchema = new Schema<IDesignApplication>({
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
  scale: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 5,
  },
  rotation: {
    type: Number,
    default: 0,
    min: -360,
    max: 360,
  },
  coordinates: {
    x: Number,
    y: Number,
  },
  appliedImage: {
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  },
});

const ProductVariantSchema = new Schema<IProductVariant>({
  color: {
    type: String,
    enum: Object.values(Color),
    required: true,
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    required: true,
  },
  sizes: [
    {
      type: String,
      enum: Object.values(Size),
    },
  ],
  baseImages: {
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
  },
  processedImages: {
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Map,
    of: Number,
    validate: {
      validator(value: Map<string, number>) {
        // Ensure all sizes have stock entries
        const variant = this as IProductVariant;
        return variant.sizes.every(
          (size) => value.has(size) && value.get(size)! >= 0,
        );
      },
      message: 'Stock must be defined for all sizes',
    },
  },
});

const DesignGroupSchema = new Schema<IDesignGroup>({
  name: {
    type: String,
    required: true,
  },
  designs: [DesignApplicationSchema],
  variants: [ProductVariantSchema],
});

interface FinalProductVirtuals {
  totalVariants: number;
  totalUniqueDesigns: number;
}

export interface FinalProductDocument
  extends Document,
    IFinalProduct,
    FinalProductVirtuals {
  getVariantsByGender(gender: Gender): IProductVariant[];
  getVariantsByColor(color: Color): IProductVariant[];
  getTotalStock(): number;
  getStockForVariant(groupId: string, variantId: string, size: Size): number;
  updateStock(
    groupId: string,
    variantId: string,
    size: Size,
    quantity: number,
  ): boolean;
  hasAvailableStock(
    groupId: string,
    variantId: string,
    size: Size,
    quantity: number,
  ): boolean;
}

const FinalProductSchema = new Schema<FinalProductDocument>(
  {
    baseProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    designGroups: [DesignGroupSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Add indexes for frequent queries
FinalProductSchema.index({ productName: 1 });
FinalProductSchema.index({ category: 1 });
FinalProductSchema.index({ 'designGroups.designs.designerId': 1 });
FinalProductSchema.index({ isActive: 1 });
FinalProductSchema.index({ tags: 1 });

// Instance methods
// eslint-disable-next-line func-names
FinalProductSchema.methods.getVariantsByGender = function (
  gender: Gender,
): IProductVariant[] {
  return this.designGroups.flatMap((group) =>
    group.variants.filter((variant) => variant.gender === gender),
  );
};

FinalProductSchema.methods.getVariantsByColor = function (
  color: Color,
): IProductVariant[] {
  return this.designGroups.flatMap((group) =>
    group.variants.filter((variant) => variant.color === color),
  );
};

// eslint-disable-next-line func-names
FinalProductSchema.methods.getTotalStock = function (): number {
  return this.designGroups.reduce((total, group) => {
    return (
      total +
      group.variants.reduce((groupTotal, variant) => {
        const stockValues = Array.from(variant.stock.values()) as number[];
        return groupTotal + stockValues.reduce((a, b) => a + b, 0);
      }, 0)
    );
  }, 0);
};

// Helper method to safely get stock for a variant
FinalProductSchema.methods.getStockForVariant = function (
  groupId: string,
  variantId: string,
  size: Size,
): number {
  const group = this.designGroups.id(groupId);
  if (!group) return 0;

  const variant = group.variants.id(variantId);
  if (!variant) return 0;

  return variant.stock.get(size) || 0;
};

// Helper method to safely update stock
FinalProductSchema.methods.updateStock = function (
  groupId: string,
  variantId: string,
  size: Size,
  quantity: number,
): boolean {
  const group = this.designGroups.id(groupId);
  if (!group) return false;

  const variant = group.variants.id(variantId);
  if (!variant) return false;

  if (!variant.sizes.includes(size)) return false;

  variant.stock.set(size, Math.max(0, quantity));
  return true;
};

// Add a method to check stock availability
FinalProductSchema.methods.hasAvailableStock = function (
  groupId: string,
  variantId: string,
  size: Size,
  quantity: number,
): boolean {
  const currentStock = this.getStockForVariant(groupId, variantId, size);
  return currentStock >= quantity;
};

// Virtual for total variants count
// eslint-disable-next-line func-names
FinalProductSchema.virtual('totalVariants').get(function (
  this: FinalProductDocument,
) {
  return this.designGroups.reduce(
    (total, group) => total + group.variants.length,
    0,
  );
});

// Middleware to update related documents
// eslint-disable-next-line func-names
FinalProductSchema.post('save', async function (doc) {
  // Update design applied counts
  const designIds = doc.designGroups.flatMap((group) =>
    group.designs.map((design) => design.designId),
  );

  await mongoose
    .model('Design')
    .updateMany({ _id: { $in: designIds } }, { $inc: { appliedCount: 1 } });
});

const finalProduct = mongoose.model<FinalProductDocument>(
  'FinalProduct',
  FinalProductSchema,
);

export { finalProduct };
