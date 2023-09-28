import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import {
  requestDesigner,
  updateDesignerProfile,
  addProfilePhoto,
  addPanCard,
  checkDesignerApproval,
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
  checkDesignerApproval,
  updateDesignerProfile,
);

router.post(
  '/designer/addProfilePhoto',
  [protectedByApiKey],
  checkDesignerApproval,
  addProfilePhoto,
);

router.post(
  '/designer/addPanCard',
  [protectedByApiKey],
  checkDesignerApproval,
  addPanCard,
);

export default router;
