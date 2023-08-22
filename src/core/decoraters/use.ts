/* eslint-disable func-names */
import 'reflect-metadata';
import { RequestHandler } from 'express';
import { Metadatakeys } from './MetadataKeys';

// eslint-disable-next-line import/prefer-default-export
export function use(middleware: RequestHandler) {
  return function (target: any, key: string) {
    const middlewares =
      Reflect.getMetadata(Metadatakeys.middleware, target, key) || [];

    middlewares.push(middleware);

    Reflect.defineMetadata(Metadatakeys.middleware, middlewares, target, key);
  };
}
