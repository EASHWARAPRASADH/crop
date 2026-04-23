import express from 'express';
import { analyzePhoto, processImage } from '../controllers/aiController.js';

const router = express.Router();

// Public routes (for now, to match original implementation)
router.post('/analyze-photo', analyzePhoto);
router.post('/process-image', processImage);

export default router;
