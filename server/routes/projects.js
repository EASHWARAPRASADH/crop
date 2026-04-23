import express from 'express';
import { createProject, getProjects, getProject, updateProject, deleteProject, getProjectStats } from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(authorize('admin', 'super-admin'), deleteProject);
router.get('/:id/stats', getProjectStats);

export default router;
