import { Router } from 'express';
import {
  deleteFileHandler,
  streamFileHandler,
  thumbnailHandler,
} from '../../controllers/file.controller.js';
import { scanHandler } from '../../controllers/scan.controller.js';

const router = Router();

router.get('/scan', scanHandler);
router.delete('/files/:fileId', deleteFileHandler);
router.get('/files/:fileId/stream', streamFileHandler);
router.get('/files/:fileId/thumbnail', thumbnailHandler);

export default router;