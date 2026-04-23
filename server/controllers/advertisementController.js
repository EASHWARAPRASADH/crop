import Advertisement from '../models/Advertisement.js';

// @desc    Get all advertisements
// @route   GET /api/advertisements
export const getAdvertisements = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        let query = {};
        if (activeOnly === 'true') query.isActive = true;
        const ads = await Advertisement.find(query).sort('displayOrder');
        res.json(ads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get advertisement by ID
// @route   GET /api/advertisements/:id
export const getAdvertisementById = async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Advertisement not found' });
        res.json(ad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create advertisement
// @route   POST /api/advertisements
export const createAdvertisement = async (req, res) => {
    try {
        const ad = await Advertisement.create(req.body);
        res.status(201).json(ad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update advertisement
// @route   PUT /api/advertisements/:id
export const updateAdvertisement = async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ad) return res.status(404).json({ message: 'Advertisement not found' });
        res.json(ad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete advertisement
// @route   DELETE /api/advertisements/:id
export const deleteAdvertisement = async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Advertisement not found' });
        res.json({ message: 'Advertisement removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle active status
// @route   PUT /api/advertisements/:id/toggle
export const toggleAdvertisement = async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Advertisement not found' });
        ad.isActive = !ad.isActive;
        await ad.save();
        res.json(ad);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
