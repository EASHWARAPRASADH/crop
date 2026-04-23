import express from 'express';
import { getFonts, createFont, toggleFavorite, seedGoogleFonts, deleteFont } from '../controllers/fontController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/seed', authorize('admin'), seedGoogleFonts);
router.route('/').get(getFonts).post(upload.single('fontFile'), createFont);
router.put('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteFont);

export default router;
