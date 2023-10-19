import mongoose from 'mongoose';
import { IModel } from '@core/interfaces/validationSchema';

export interface IDesigner {
  userId: { type: mongoose.Schema.Types.ObjectId };
  profileImage?: IModel;
  coverImage?: IModel;
  Designs?: [{ type: mongoose.Schema.Types.ObjectId }];
  isApproved: Boolean;
  followers?: mongoose.Schema.Types.ObjectId[];
  legal_first_name?: String;
  legal_last_name?: String;
  fullname?: String;
  artistName?: String;
  description?: String;
  socialMedia?: String[];
  phone?: number;
  legal_address?: mongoose.Schema.Types.ObjectId[];
  portfolioLinks?: String[];
  cvLinks?: String[];
  panCard?: IModel;
  panCardNumber?: String;
  dateOfBirth?: Date;
}
