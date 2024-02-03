import { IModel } from '@core/interfaces/validationSchema';

export interface IDesign {
  finalProduct: any;
  designImage: IModel; // will there be multiple design images ?
  designer: any;
  likes: number;
  title: String;
  description: String;
  isVerified: Boolean;
}
