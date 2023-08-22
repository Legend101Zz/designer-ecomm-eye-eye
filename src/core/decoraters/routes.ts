import 'reflect-metadata';
import { Methods } from './Methods';
import { Metadatakeys } from './MetadataKeys';

function routeBinder(method: string) {
  // eslint-disable-next-line func-names
  return function (path: string) {
    // eslint-disable-next-line func-names
    return function (target: any, key: string) {
      Reflect.defineMetadata(Metadatakeys.path, path, target, key);
      Reflect.defineMetadata(Metadatakeys.method, method, target, key);
    };
  };
}

export const get = routeBinder(Methods.get);
export const post = routeBinder(Methods.post);
export const patch = routeBinder(Methods.patch);
export const del = routeBinder(Methods.del);
export const put = routeBinder(Methods.put);
