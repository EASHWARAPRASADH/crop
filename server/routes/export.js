import express from 'express';
import { exportProject, getExportStatus } from '../controllers/exportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/:projectId', exportProject);
router.get('/:exportId/status', getExportStatus);

export default router;
