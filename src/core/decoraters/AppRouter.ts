import express from 'express';
// import logger from '@core/utils/logger';

// eslint-disable-next-line import/prefer-default-export
export class AppRouter {
  private static instance: express.Router;

  static getInstance(): express.Router {
    if (!AppRouter.instance) {
      AppRouter.instance = express.Router();
    }
    // logger.info(AppRouter.instance.get.name);
    return AppRouter.instance;
  }
}
