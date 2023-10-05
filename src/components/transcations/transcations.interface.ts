import mongoose from 'mongoose';
export interface Itranscations {
    name: string;
   productsBought : [];
    color: Color;
    category: Category;
    image: IModel;
  }