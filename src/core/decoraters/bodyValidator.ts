import 'reflect-metadata';
import { Metadatakeys } from './MetadataKeys';

// eslint-disable-next-line import/prefer-default-export
export function bodyValidator(...keys: string[]) {
  return function (target: any, key: string) {
    Reflect.defineMetadata(Metadatakeys.validator, keys, target, key);
  };
}
