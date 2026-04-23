import express from 'express';
import { getAdvertisements, getAdvertisementById, createAdvertisement, updateAdvertisement, deleteAdvertisement, toggleAdvertisement } from '../controllers/advertisementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: get active advertisements (no auth needed)
router.get('/public', async (req, res) => {
    try {
        const Advertisement = (await import('../models/Advertisement.js')).default;
        const ads = await Advertisement.find({ isActive: true }).sort('displayOrder');
        res.json(ads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Protected routes
router.use(protect);

router.route('/').get(getAdvertisements).post(createAdvertisement);
router.route('/:id').get(getAdvertisementById).put(updateAdvertisement).delete(deleteAdvertisement);
router.put('/:id/toggle', toggleAdvertisement);

export default router;
