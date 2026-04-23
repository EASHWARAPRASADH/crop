import Template from '../models/Template.js';

// @desc    Create template
// @route   POST /api/templates
export const createTemplate = async (req, res) => {
    try {
        const template = await Template.create({
            ...req.body,
            createdBy: req.user._id,
        });
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get templates with filtering
// @route   GET /api/templates
export const getTemplates = async (req, res) => {
    try {
        const { category, style, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
        const query = { isPublic: true };

        if (category) query.category = category;
        if (style) query.style = style;
        if (search) {
            query.$text = { $search: search };
        }

        const total = await Template.countDocuments(query);
        const templates = await Template.find(query)
            .select('name category style thumbnail cardSize hasTwoSides primaryColor useCount favoriteCount tags')
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({
            templates,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
export const getTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Increment use count
        template.useCount += 1;
        await template.save();

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update template
// @route   PUT /api/templates/:id
export const updateTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
export const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        await template.deleteOne();
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Duplicate template
// @route   POST /api/templates/:id/duplicate
export const duplicateTemplate = async (req, res) => {
    try {
        const original = await Template.findById(req.params.id);
        if (!original) return res.status(404).json({ message: 'Template not found' });

        const duplicate = await Template.create({
            ...original.toObject(),
            _id: undefined,
            name: `${original.name} (Copy)`,
            createdBy: req.user._id,
            useCount: 0,
            favoriteCount: 0,
            createdAt: undefined,
            updatedAt: undefined,
        });

        res.status(201).json(duplicate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get template categories count
// @route   GET /api/templates/categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Template.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
