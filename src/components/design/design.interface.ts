import mongoose from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';

export interface IDesign {
  designImage: IModel; // will there be multiple design images ?
  designer: mongoose.Schema.Types.ObjectId;
  finalProduct: mongoose.Schema.Types.ObjectId[];
  likes: number;
  title: string;
  description: string;
  isVerified: boolean;
  appliedCount: number;
  tags: string[];
}
