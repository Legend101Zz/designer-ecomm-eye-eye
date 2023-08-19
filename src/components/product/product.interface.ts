// what to do of prices
import { IModel } from '@core/interfaces/validationSchema';

export interface Iproduct {
  name: string;
  quantity: number;
  color: Color;
  category: Category;
  image: IModel;
}

enum Color {
  red = 'red',
  black = 'black',
  white = 'white',
  yellow = 'yellow',
}

enum Category {
  shirt = 'shirt',
  Tshirt = 'Tshirt',
  Cup = 'cup',
}
