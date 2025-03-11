import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import validation from '@core/middlewares/validate.middleware';
import {
  authenticate,
  authorizeRole,
} from '@core/middlewares/userAuth.middleware';
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
  // designByCategory,
  joinWaitlist,
  getRandomDesigners,
  updateSettings,
  getSettings,
  transformToArray,
  getDesignerProducts,
  getAuthenticatedDesignerProducts,
} from './designer.controller';
import {
  designerValidationSchema,
  updateDesignerValidationSchema,
  // createDesignValidationSchema,
  waitlistValidationSchema,
} from './designer.validation';

const router: Router = Router();

// TO GET RANDOM DESIGNERS
router.use(protectedByApiKey);

router.get(
  '/designer/getRandomDesigner',
  [protectedByApiKey],
  getRandomDesigners,
);

// TO GET DESIGNER DETAILS
router.get(
  '/designer/viewProfile/:designerId',
  [checkDesignerApproval],
  publicData,
);
router.get(
  '/designer/viewProfile/',
  [authenticate, checkDesignerApproval],
  publicData,
);

router.get(
  '/designer/personalProfile/:designerId',
  [checkDesignerApproval],
  // checkDesignerApproval,
  personalData,
);
router.get(
  '/designer/personalProfile/',
  [authenticate, checkDesignerApproval, authorizeRole('designer')],
  // checkDesignerApproval,
  personalData,
);

router.get('/designer/check', [authenticate], (req, res) => {
  return res
    .status(200)
    .json({ isDesigner: req.user?.role === 'designer' ? true : false });
});

// waitlist
router.post(
  '/designer/join-waitlist',
  [protectedByApiKey, validation(waitlistValidationSchema)],
  joinWaitlist,
);

// GET DESIGN IMAGES

router.get('/designer/design-images/:designerId', getDesigns);
router.get('/designer/design-images', [authenticate], getDesigns);

// GET DESIGNER PRODUCTS
router.get(
  '/designer/my-products',
  [protectedByApiKey, authenticate],
  getAuthenticatedDesignerProducts,
);
router.get(
  '/designer/designer-products/:designerId',
  [protectedByApiKey],
  getDesignerProducts,
);

// GET PRODUCTS BY CATEGORY
// router.get(
//   '/designer/design-images-category/:designerId',
//   [protectedByApiKey],
//   designByCategory,
// );

// REGISTER DESIGNER
router.post(
  '/designer/request',

  [
    protectedByApiKey,
    cloudinaryMiddleware,
    transformToArray,
    validation(designerValidationSchema),
  ],

  requestDesigner,         
);

// TO UPDATE PROFILE DESIGNER
router.post(
  '/designer/updateProfile',
  [protectedByApiKey, validation(updateDesignerValidationSchema)],
  authorizeRole('designer'),
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

// TO ADD NEW DESIGN
router.post(
  '/designer/createDesign',

  [
    protectedByApiKey,
    cloudinaryMiddleware,
    authenticate,
    checkDesignerApproval,
  ],
  authorizeRole('designer'),
  createDesign,
);

// DESIGNER PUBLIC PROFILE SETTINGS ROUTE

router.get(
  '/designer/show-designer-settings/:designerId',

  [protectedByApiKey, checkDesignerApproval],
  getSettings,
);
router.get(
  '/designer/show-designer-settings',

  [protectedByApiKey, authenticate, checkDesignerApproval],
  authorizeRole('designer'),
  getSettings,
);

router.post(
  '/designer/update-settings/:designerId',

  [protectedByApiKey, authenticate, checkDesignerApproval],
  authorizeRole('designer'),
  updateSettings,
);
router.post(
  '/designer/update-settings',

  [protectedByApiKey, authenticate, checkDesignerApproval],
  authorizeRole('designer'),
  updateSettings,
);
export default router;
