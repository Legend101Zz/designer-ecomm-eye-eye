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

router.post('/admin/create', [protectedByApiKey], createAdmin);
router.post('/admin/login', [protectedByApiKey], loginAdmin);

// render ejs

router.get('/admin/dashboard', (req, res) => {
  res.render('dashboard');
});

router.get('/admin/billing', (req, res) => {
  res.render('billing');
});

// products routes

router.get('/admin/products', products);
router.post('/admin/edit-product', editProduct);
router.post('/admin/add-product', cloudinaryMiddleware, addProduct);
router.get('/admin/addProduct', (req, res) => {
  res.render('addProd');
});
router.get('/admin/editProduct/:productId', renderEditProductPage);

// designer routes
router.get('/admin/designer', allDesigners);
router.get('/admin/designer/approve/:designerId', approveDesignerController);
router.get('/admin/design/approve/:designId', verifyDesignController);
router.get('/admin/designer/:id', getDesignerDetails);

export default router;
