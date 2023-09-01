import { Router } from 'express';
import healthCheck from '@components/healthcheck/healthCheck.router';
import user from '@components/user/user.router';
import product from '@components/product/product.router';

const router: Router = Router();
router.use(healthCheck);
router.use(user);
router.use(product);

export default router;
