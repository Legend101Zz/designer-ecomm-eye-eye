import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { createAdmin, loginAdmin } from './admin.controller';

const router: Router = Router();

router.post('/admin/create', [protectedByApiKey], createAdmin);
router.post('/admin/login', [protectedByApiKey], loginAdmin);
router.get('/admin', (req, res) => {
  res.render('index');
});

export default router;
