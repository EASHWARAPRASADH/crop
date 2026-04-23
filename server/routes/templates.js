import express from 'express';
import { createTemplate, getTemplates, getTemplate, updateTemplate, deleteTemplate, duplicateTemplate, getCategories } from '../controllers/templateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/categories', getCategories);
router.route('/').get(getTemplates).post(createTemplate);
router.route('/:id').get(getTemplate).put(updateTemplate).delete(deleteTemplate);
router.post('/:id/duplicate', duplicateTemplate);

export default router;
