// what to do of prices
import { IModel } from '@core/interfaces/validationSchema';

export interface Iproduct {
  name: string;
  quantity: number;
  color?: Color[];
  category: Category;
  image: IModel[];
  sizes?: Size[];
  basePrice: number;
  gender?: Gender;
}

export enum Color {
  red = 'red',
  black = 'black',
  white = 'white',
  yellow = 'yellow',
  blue = 'blue',
}

export enum Category {
  shirt = 'shirt',
  Tshirt = 'Tshirt',
  hoodie = 'hoodie',
  Cup = 'cup',
}

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

export enum Gender {
  male = 'male',
  female = 'female',
  unisex = 'unisex',
}
