import mongoose from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';

export interface IDesigner {
  userId: { type: mongoose.Schema.Types.ObjectId };
  profileImage?: IModel;
  Designs?: [{ type: mongoose.Schema.Types.ObjectId }];
  isApproved: Boolean;
  legal_first_name?: String;
  legal_last_name?: String;
  description?: String;
  socialMedia?: String[];
  phone: number;
  legal_address?: String;
  portfolioLinks?: String[];
  panCard?: IModel;
}
