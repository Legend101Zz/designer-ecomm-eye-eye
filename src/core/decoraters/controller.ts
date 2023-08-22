import 'reflect-metadata';
import { NextFunction, Request, Response, RequestHandler } from 'express';
import logger from '@core/utils/logger';
import { AppRouter } from './AppRouter';
import { Methods } from './Methods';
import { Metadatakeys } from './MetadataKeys';

// checking if the specified fields are there in body or not

function bodyValidators(keys: string[]): RequestHandler {
  // eslint-disable-next-line func-names
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
      res.status(422).send('Invalid Request');
      return;
    }

    // eslint-disable-next-line security/detect-object-injection
    const missingKeys = keys.filter((key) => !req.body[key]);

    if (missingKeys.length > 0) {
      res.status(422).send('Invalid Request');
      return;
    }

    next();
  };
}

// eslint-disable-next-line import/prefer-default-export
export function controller(routePrefix: string) {
  // eslint-disable-next-line func-names
  return function (target: any) {
    const router = AppRouter.getInstance();

    const prototypeKeys = Object.keys(target.prototype);

    prototypeKeys.forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection
      const routeHandler = target.prototype[key];

      const path = Reflect.getMetadata(
        Metadatakeys.path,
        target.prototype,
        key,
      );

      const method: Methods = Reflect.getMetadata(
        Metadatakeys.method,
        target.prototype,
        key,
      );

      const middlewares =
        Reflect.getMetadata(Metadatakeys.middleware, target.prototype, key) ||
        [];

      const requiredBodyProps: string[] =
        Reflect.getMetadata(Metadatakeys.validator, target.prototype, key) ||
        [];

      const validator = bodyValidators(requiredBodyProps);

      if (path && method) {
        // eslint-disable-next-line security/detect-object-injection
        router[method](
          `${routePrefix}${path}`,
          ...middlewares,
          validator,
          routeHandler,
        );
      } else {
        logger.error('Error: Invalid route configuration');
      }
    });
  };
}
