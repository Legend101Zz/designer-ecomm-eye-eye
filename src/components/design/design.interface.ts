import { IModel } from '@core/interfaces/validationSchema';

export interface IDesign {
  product: any;
  designImage: IModel; // will there be multiple design images ?
  designer: any;
  likes: number;
  title: String;
  description: String;
}
