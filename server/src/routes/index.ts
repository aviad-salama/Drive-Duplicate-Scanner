import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { attachCloudAccount } from '../middleware/cloud.middleware.js';
import accountsRoutes from './accounts/index.js';
import authRoutes from './auth/index.js';
import cloudRoutes from './cloud/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cloud', cloudRoutes);
router.use('/accounts/:accountId', requireAuth, attachCloudAccount, accountsRoutes);

export default router;
