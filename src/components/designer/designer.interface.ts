import mongoose from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';

export interface IDesigner {
  userId: { type: mongoose.Schema.Types.ObjectId };
  profileImage: IModel;
  Designs: [{ type: mongoose.Schema.Types.ObjectId }];
  isApproved: Boolean;
}
