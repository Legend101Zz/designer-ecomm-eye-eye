/* eslint-disable no-restricted-syntax */
import mongoose, { Schema, Document } from 'mongoose';
import { Gender, Size } from '../product/product.interface';
import { IModel, IFinalProduct } from './finalprod.interface';

const ImageSchema = new Schema<IModel>({
  url: String,
  filename: String,
});

const DesignPlacementSchema = new Schema({
  designId: {
    type: Schema.Types.ObjectId,
    ref: 'Design',
    required: true,
    validate: {
      validator: async (designId: mongoose.Types.ObjectId) => {
        const design = await mongoose.model('Design').findById(designId);
        return design?.isVerified === true;
      },
      message: 'Can only use verified designs',
    },
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
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
});

const ProductVariantSchema = new Schema({
  baseProductId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    validate: {
      validator: async (id: mongoose.Types.ObjectId) => {
        const product = await mongoose.model('Product').findById(id);
        return product?.isActive === true;
      },
      message: 'Base product must exist and be active',
    },
  },
  color: {
    type: String,
    required: true,
  },
  stock: {
    type: Map,
    of: Number,
    validate: {
      validator: (stock: Map<string, number>) => {
        return Array.from(stock.values()).every((qty) => qty >= 0);
      },
      message: 'Stock quantities must be non-negative',
    },
  },
});

const DesignGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    required: true,
  },
  designs: [DesignPlacementSchema],
  variants: [ProductVariantSchema],
  processedImages: {
    front: [ImageSchema],
    back: [ImageSchema],
  },
  designPrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Document interface
export interface FinalProductDocument extends Document, IFinalProduct {
  getTotalStock(): number;
  hasAvailableStock(
    groupId: string,
    baseProductId: string,
    color: string,
    size: Size,
    quantity: number,
  ): boolean;
  updateStock(
    groupId: string,
    baseProductId: string,
    color: string,
    size: Size,
    quantity: number,
  ): Promise<boolean>;
}

// Schema
const FinalProductSchema = new Schema<FinalProductDocument>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    designGroups: [DesignGroupSchema],
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes
FinalProductSchema.index({ productName: 1 });
FinalProductSchema.index({ 'designGroups.designs.designId': 1 });
FinalProductSchema.index({ 'designGroups.variants.baseProductId': 1 });
FinalProductSchema.index({ tags: 1 });
FinalProductSchema.index({ isActive: 1 });

// Methods
// eslint-disable-next-line func-names
FinalProductSchema.methods.getTotalStock = function (): number {
  return this.designGroups.reduce(
    (total, group) =>
      total +
      group.variants.reduce(
        (groupTotal, variant) =>
          groupTotal +
          Array.from(variant.stock.values()).reduce(
            (a: number, b: number) => a + b,
            0,
          ),
        0,
      ),
    0,
  );
};
// eslint-disable-next-line func-names
FinalProductSchema.methods.hasAvailableStock = function (
  groupId: string,
  baseProductId: string,
  color: string,
  size: Size,
  quantity: number,
): boolean {
  const group = this.designGroups.id(groupId);
  if (!group) return false;

  const variant = group.variants.find(
    (v) => v.baseProductId.toString() === baseProductId && v.color === color,
  );
  if (!variant) return false;

  const currentStock = variant.stock.get(size) || 0;
  return currentStock >= quantity;
};
// eslint-disable-next-line func-names
FinalProductSchema.methods.updateStock = async function (
  groupId: string,
  baseProductId: string,
  color: string,
  size: Size,
  quantity: number,
): Promise<boolean> {
  const group = this.designGroups.id(groupId);
  if (!group) return false;

  const variant = group.variants.find(
    (v) => v.baseProductId.toString() === baseProductId && v.color === color,
  );
  if (!variant) return false;

  if (quantity < 0) return false;

  variant.stock.set(size, quantity);
  await this.save();
  return true;
};

// Pre-save hooks
// eslint-disable-next-line func-names
FinalProductSchema.pre('save', async function (next) {
  // Validate design placements are unique within a group
  for (const group of this.designGroups) {
    const designPositions = new Set();
    for (const placement of group.designs) {
      const key = `${placement.designId}_${placement.position}`;
      if (designPositions.has(key)) {
        throw new Error(
          'Cannot use same design multiple times in same position',
        );
      }
      designPositions.add(key);
    }

    // Validate each variant references an existing product
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      group.variants.map(async (variant) => {
        const baseProduct = await mongoose
          .model('Product')
          .findById(variant.baseProductId);
        if (!baseProduct?.isActive) {
          throw new Error(
            `Base product ${variant.baseProductId} not found or inactive`,
          );
        }
      }),
    );
  }
  next();
});

// Post-save hooks
// eslint-disable-next-line func-names
FinalProductSchema.post('save', async function (doc) {
  // Update design application counts
  const designIds = doc.designGroups.flatMap((group) =>
    group.designs.map((d) => d.designId),
  );

  await mongoose
    .model('Design')
    .updateMany({ _id: { $in: designIds } }, { $inc: { appliedCount: 1 } });
});

export const finalProduct = mongoose.model<FinalProductDocument>(
  'FinalProduct',
  FinalProductSchema,
);
