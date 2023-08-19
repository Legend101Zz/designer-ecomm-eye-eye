import { Schema } from 'joi';

export interface ValidationSchema {
  body?: Schema;
  params?: Schema;
  query?: Schema;
}

export interface IModel {
  url: string;
  filename: string;
}
