import { Router } from 'express';

import healthCheck from '@components/healthcheck/healthCheck.router';

const router: Router = Router();
router.use(healthCheck);

export default router;
