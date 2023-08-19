import { IModel } from '@core/interfaces/validationSchema';

export interface IDesigner {
  username: String;
  password: String;
  profileImage: IModel;
  Designs: any;
}
