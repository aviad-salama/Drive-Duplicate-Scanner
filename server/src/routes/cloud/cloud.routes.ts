import { Router } from 'express';
import { controlScanHandler, scanAllHandler } from '../../controllers/scan.controller.js';
import {
  callbackHandler,
  connectHandler,
  deleteAccountHandler,
  listAccountsHandler,
} from '../../controllers/cloud.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/accounts', requireAuth, listAccountsHandler);
router.delete('/accounts/:id', requireAuth, deleteAccountHandler);
router.get('/:provider/connect', requireAuth, connectHandler);
router.get('/:provider/callback', callbackHandler); // No requireAuth: the state identifies the user.
router.get('/scan-all', requireAuth, scanAllHandler);
router.post('/scans/:scanId/:action', requireAuth, controlScanHandler);
export default router;