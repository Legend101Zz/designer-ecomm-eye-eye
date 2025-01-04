import mongoose, { Schema } from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';
import { IDesign } from './design.interface';

const ImageSchema: Schema<IModel> = new Schema({
  url: String,
  filename: String,
});

const DesignSchema: Schema<IDesign> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: { type: String },
    designImage: [ImageSchema],
    designer: {
      type: Schema.Types.ObjectId,
      ref: 'Designer',
      required: true,
    },
    finalProduct: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isVerified: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    appliedCount: { type: Number, default: 0 },
    tags: {
      type: [String],
      required: true, // Make tags required
      validate: {
        validator(v: string[]) {
          return v.length > 0; // Ensure at least one tag is provided
        },
        message: 'At least one tag is required',
      },
    },
  },
  { timestamps: true },
);

const design = mongoose.model<IDesign>('Design', DesignSchema);
// eslint-disable-next-line import/prefer-default-export
export { design };
