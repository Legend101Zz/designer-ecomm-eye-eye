import { Router } from 'express';
import { AppRouter } from '@core/decoraters';
import healthCheck from '@components/healthcheck/healthCheck.router';
import '@components/user/user.controller';

const router: Router = Router();
router.use(healthCheck);
router.use(AppRouter.getInstance());

export default router;
