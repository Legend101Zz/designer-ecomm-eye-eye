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
  personalData,
  getDesigns,
  designByCategory,
  getRandomDesigners,
} from './designer.controller';
import {
  requestDesignerValidation,
  updateDesignerValidationSchema,
  // createDesignValidationSchema,
} from './createDesigner.validation';

const router: Router = Router();

// TO GET RANDOM DESIGNERS

router.get(
  '/designer/getRandomDesigner',
  [protectedByApiKey],
  getRandomDesigners,
);

// TO GET DESIGNER DETAILS
router.get(
  '/designer/viewProfile/:designerId',
  [protectedByApiKey],
  publicData,
);

router.get(
  '/designer/personalProfile/:designerId',
  [protectedByApiKey],
  // checkDesignerApproval,
  personalData,
);

// GET DESIGN IMAGES

router.get(
  '/designer/design-images/:designerId',
  [protectedByApiKey],
  getDesigns,
);

// GET PRODUCTS BY CATEGORY
router.get(
  '/designer/design-images-category/:designerId',
  [protectedByApiKey],
  designByCategory,
);

// REGISTER DESIGNER
router.post(
  '/designer/request',

  [
    protectedByApiKey,
    cloudinaryMiddleware,
    // validation(requestDesignerValidation),
  ],

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

  [protectedByApiKey, cloudinaryMiddleware, checkDesignerApproval],

  createDesign,
);

export default router;
