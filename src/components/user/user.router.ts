import { Router } from 'express';
import { AppRouter } from '@core/decoraters';
import './user.controller';

const router: Router = Router();

router.use(AppRouter.getInstance());

export default router;
