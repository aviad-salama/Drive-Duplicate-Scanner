import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
} from '../../controllers/auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, meHandler);

export default router;