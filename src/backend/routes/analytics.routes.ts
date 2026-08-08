import { Router } from 'express';
import { getAnalyticsHandler } from '../controllers/analytics.controller';

const router = Router();

router.get('/', getAnalyticsHandler);

export default router;
