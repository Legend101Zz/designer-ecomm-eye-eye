import { Router } from 'express';
import healthCheck from '@components/healthcheck/healthCheck.router';
import user from '@components/user/user.router';
import product from '@components/product/product.router';
import designer from '@components/designer/designer.router';
import wishlist from '@components/wishlist/wishlist.router';
import design from '@components/design/design.router';

const router: Router = Router();
router.use(healthCheck);
router.use(user);
router.use(product);
router.use(designer);
router.use(wishlist);
router.use(design);

export default router;
