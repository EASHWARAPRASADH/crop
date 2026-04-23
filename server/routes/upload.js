import express from 'express';
import upload from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Single photo upload
router.post('/photo', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// Multiple photo upload
router.post('/photos', upload.array('photos', 100), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const files = req.files.map(f => ({ url: `/uploads/${f.filename}`, filename: f.filename, originalName: f.originalname }));
    res.json({ count: files.length, files });
});

// Excel/CSV upload
router.post('/excel', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// ZIP upload
router.post('/zip', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

export default router;
