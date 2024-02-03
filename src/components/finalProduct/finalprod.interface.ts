// what to do of prices
import { IModel } from '@core/interfaces/validationSchema';

export interface IfinalProduct {
  designerId: any;
  productId: any;
  designId: any;
  color: Color;
  category: Category;
  sales: number;
  prodImages: [IModel];
  price: number;
}

export enum Category {
  shirt = 'shirt',
  Tshirt = 'Tshirt',
  Cup = 'cup',
}

export enum Color {
  red = 'red',
  black = 'black',
  white = 'white',
  yellow = 'yellow',
  blue = 'blue',
}
