import { Router } from 'express';
import protectedByApiKey from '@core/middlewares/apiKey.middleware';
import { addToWishList } from './wishlist.controller';

const router: Router = Router();

router.post('/wishlist/add', [protectedByApiKey], addToWishList);

export default router;
