import Project from '../models/Project.js';
import Record from '../models/Record.js';

// @desc    Create project
// @route   POST /api/projects
export const createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            createdBy: req.user._id,
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all projects
// @route   GET /api/projects
export const getProjects = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};

        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };

        const projects = await Project.find(query)
            .populate('templateId', 'name thumbnail category')
            .populate('createdBy', 'name email')
            .sort('-createdAt');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
export const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('templateId')
            .populate('createdBy', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Delete all records in this project
        await Record.deleteMany({ projectId: project._id });
        await project.deleteOne();

        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get project stats
// @route   GET /api/projects/:id/stats
export const getProjectStats = async (req, res) => {
    try {
        const projectId = req.params.id;
        const [total, valid, invalid, missingPhotos, duplicates] = await Promise.all([
            Record.countDocuments({ projectId }),
            Record.countDocuments({ projectId, validationStatus: 'valid' }),
            Record.countDocuments({ projectId, validationStatus: 'invalid' }),
            Record.countDocuments({ projectId, photoUrl: '' }),
            Record.aggregate([
                { $match: { projectId: projectId } },
                { $group: { _id: '$idNumber', count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $count: 'duplicates' },
            ]),
        ]);

        res.json({
            total,
            valid,
            invalid,
            pending: total - valid - invalid,
            missingPhotos,
            duplicates: duplicates[0]?.duplicates || 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
