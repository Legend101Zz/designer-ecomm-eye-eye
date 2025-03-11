import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';

import {
  createAdmin,
  loginAdmin,
  addProduct,
  products,
  renderEditProductPage,
  editProduct,
  allDesigners,
  getDesignerDetails,
  approveDesignerController,
  verifyDesignController,
} from './admin.controller';

const router: Router = Router();

// Admin user management
router.post('/admin/create', [protectedByApiKey], createAdmin);
router.post('/admin/login', loginAdmin); // Removed API key requirement for login

// Dashboard & admin pages - Remove API key requirement for admin pages
router.get('/admin/dashboard', (req, res) => {
  res.render('dashboard');
});

router.get('/admin/billing', (req, res) => {
  res.render('billing');
});

// Products routes - Remove API key requirement for admin UI routes
router.get('/admin/products', products);
router.post('/admin/edit-product', editProduct);
router.post('/admin/add-product', cloudinaryMiddleware, addProduct);
router.get('/admin/addProduct', (req, res) => {
  res.render('addProd');
});
router.get('/admin/editProduct/:productId', renderEditProductPage);

// Designer routes - Remove API key requirement for admin UI routes
router.get('/admin/designer', allDesigners);
router.get('/admin/designer/approve/:designerId', approveDesignerController);
router.get('/admin/design/approve/:designId', verifyDesignController);
router.get('/admin/designer/:id', getDesignerDetails);

export default router;
