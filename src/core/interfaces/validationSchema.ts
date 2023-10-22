import { Schema } from 'joi';

export interface ValidationSchema {
  body?: Schema;
  params?: Schema;
  query?: Schema;
  files?: Schema;
}

export interface IModel {
  url: string;
  filename: string;
}
