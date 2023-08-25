import 'reflect-metadata';
import logger from '@core/utils/logger';
import { Methods } from './Methods';
import { Metadatakeys } from './MetadataKeys';

logger.info(Reflect);

function routeBinder(method: string) {
  // eslint-disable-next-line func-names
  return function (path: string) {
    // eslint-disable-next-line func-names
    return function (target: any, key: string) {
      logger.debug(key);
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
