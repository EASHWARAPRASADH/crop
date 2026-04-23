import School from '../models/School.js';

// @desc    Get all schools
// @route   GET /api/schools
export const getSchools = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = { $text: { $search: search } };
        }
        const schools = await School.find(query).sort('-createdAt');
        res.json(schools);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get school by ID
// @route   GET /api/schools/:id
export const getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get school by userId
// @route   GET /api/schools/user/:userId
export const getSchoolByUser = async (req, res) => {
    try {
        const school = await School.findOne({ userId: req.params.userId });
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create school
// @route   POST /api/schools
export const createSchool = async (req, res) => {
    try {
        const school = await School.create(req.body);
        res.status(201).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update school
// @route   PUT /api/schools/:id
export const updateSchool = async (req, res) => {
    try {
        const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify / unverify school
// @route   PUT /api/schools/:id/verify
export const toggleVerifySchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        school.isVerified = !school.isVerified;
        await school.save();
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
export const deleteSchool = async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json({ message: 'School removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
