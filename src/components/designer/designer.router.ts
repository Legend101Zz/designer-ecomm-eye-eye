import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import {
  requestDesigner,
  updateDesignerProfile,
  addProfilePhoto,
  addPanCard,
} from './designer.controller';
import {
  createDesignerValidation,
  updateDesignerValidationSchema,
} from './createDesigner.validation';

const router: Router = Router();

router.post(
  '/designer/request',
  [protectedByApiKey, validation(createDesignerValidation)],
  requestDesigner,
);

router.post(
  '/designer/updateProfile',
  [protectedByApiKey, validation(updateDesignerValidationSchema)],
  updateDesignerProfile,
);

router.post('/designer/addProfilePhoto', [protectedByApiKey], addProfilePhoto);

router.post('/designer/addPanCard', [protectedByApiKey], addPanCard);

export default router;
