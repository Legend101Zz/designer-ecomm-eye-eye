import { Schema } from 'joi';

export interface ValidationSchema {
  body?: Schema;
  params?: Schema;
  query?: Schema;
  files?: Schema;
}

export interface IModel {
  map(arg0: (image: any) => { url: any; filename: any; }): any;
  url: string;
  filename: string;
}
