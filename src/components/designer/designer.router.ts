import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import {
  requestDesigner,
  updateDesignerProfile,
  addProfilePhoto,
  addPanCard,
  checkDesignerApproval,
  publicData,
  createDesign,
} from './designer.controller';
import {
  createDesignerValidation,
  updateDesignerValidationSchema,
  createDesignValidationSchema,
} from './createDesigner.validation';

const router: Router = Router();

router.get(
  '/designer/viewProfile/:designerId',
  [protectedByApiKey],
  checkDesignerApproval,
  publicData,
);

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
  cloudinaryMiddleware,
  checkDesignerApproval,

  addProfilePhoto,
);

router.post(
  '/designer/addPanCard',
  [protectedByApiKey],
  cloudinaryMiddleware,
  checkDesignerApproval,

  addPanCard,
);

router.post(
  '/designer/createDesign',
  cloudinaryMiddleware,
  [protectedByApiKey, validation(createDesignValidationSchema)],
  checkDesignerApproval,

  createDesign,
);

export default router;
