import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { createAdmin, loginAdmin } from './admin.controller';

const router: Router = Router();

router.get('/admin/create', [protectedByApiKey], createAdmin);
router.get('/admin/login', [protectedByApiKey], loginAdmin);

export default router;
