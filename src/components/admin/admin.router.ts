import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import cloudinaryMiddleware from '@core/middlewares/cloudinary';
import { createAdmin, loginAdmin, addProduct } from './admin.controller';

const router: Router = Router();

router.post('/admin/create', [protectedByApiKey], createAdmin);
router.post('/admin/login', [protectedByApiKey], loginAdmin);
router.post('/admin/add-product', cloudinaryMiddleware, addProduct);
router.get('/admin', (req, res) => {
  res.render('index');
});

// render ejs

router.get('/admin/dashboard', (req, res) => {
  res.render('dashboard');
});

router.get('/admin/billing', (req, res) => {
  res.render('billing');
});

export default router;
