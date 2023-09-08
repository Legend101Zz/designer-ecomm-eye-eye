import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import { requestDesigner } from './designer.controller';
import { createDesignerValidation } from './createDesigner.validation';

const router: Router = Router();

router.post(
  '/designer/request',
  [protectedByApiKey, validation(createDesignerValidation)],
  requestDesigner,
);

export default router;
