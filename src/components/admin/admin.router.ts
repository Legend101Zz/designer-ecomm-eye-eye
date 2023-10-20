import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { createAdmin, loginAdmin } from './admin.controller';

const router: Router = Router();

router.post('/admin/create', [protectedByApiKey], createAdmin);
router.post('/admin/login', [protectedByApiKey], loginAdmin);

export default router;
