import express from 'express';

// eslint-disable-next-line import/prefer-default-export
export class AppRouter {
  private static instance: express.Router;

  static getInstance(): express.Router {
    if (!AppRouter.instance) {
      AppRouter.instance = express.Router();
    }
    return AppRouter.instance;
  }
}
