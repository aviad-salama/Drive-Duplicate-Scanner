import { Router } from 'express';
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

export default router;