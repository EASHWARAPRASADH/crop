import Record from '../models/Record.js';
import Project from '../models/Project.js';

// @desc    Create record
// @route   POST /api/records
export const createRecord = async (req, res) => {
    try {
        const record = await Record.create(req.body);

        // Update project total
        await Project.findByIdAndUpdate(record.projectId, { $inc: { totalRecords: 1 } });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get records by project
// @route   GET /api/records
export const getRecords = async (req, res) => {
    try {
        const { projectId, status, search, page = 1, limit = 50 } = req.query;
        const query = {};

        if (projectId) query.projectId = projectId;
        if (status) query.validationStatus = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { idNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Record.countDocuments(query);
        const records = await Record.find(query)
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({
            records,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get record by ID
// @route   GET /api/records/:id
export const getRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update record
// @route   PUT /api/records/:id
export const updateRecord = async (req, res) => {
    try {
        const record = await Record.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete record
// @route   DELETE /api/records/:id
export const deleteRecord = async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        await Project.findByIdAndUpdate(record.projectId, { $inc: { totalRecords: -1 } });
        await record.deleteOne();

        res.json({ message: 'Record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk create records
// @route   POST /api/records/bulk
export const bulkCreateRecords = async (req, res) => {
    try {
        const { projectId, records } = req.body;

        const created = await Record.insertMany(
            records.map((r) => ({ ...r, projectId }))
        );

        await Project.findByIdAndUpdate(projectId, { $inc: { totalRecords: created.length } });

        res.status(201).json({ count: created.length, records: created });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate records for a project
// @route   POST /api/records/validate/:projectId
export const validateRecords = async (req, res) => {
    try {
        const { projectId } = req.params;
        const records = await Record.find({ projectId });

        let validCount = 0;
        let invalidCount = 0;
        const idNumbers = new Map();

        for (const record of records) {
            const errors = [];

            // Check missing name
            if (!record.name || record.name.trim() === '') {
                errors.push('Missing name');
            }

            // Check missing photo
            if (!record.photoUrl) {
                errors.push('Missing photo');
            }

            // Check duplicate ID
            if (record.idNumber) {
                if (idNumbers.has(record.idNumber)) {
                    errors.push('Duplicate ID number');
                    // Also mark the first occurrence
                    const firstId = idNumbers.get(record.idNumber);
                    await Record.findByIdAndUpdate(firstId, {
                        $addToSet: { validationErrors: 'Duplicate ID number' },
                        validationStatus: 'invalid',
                    });
                } else {
                    idNumbers.set(record.idNumber, record._id);
                }
            }

            // Check empty required fields
            if (!record.idNumber) errors.push('Missing ID number');

            if (errors.length > 0) {
                record.validationStatus = 'invalid';
                record.validationErrors = errors;
                invalidCount++;
            } else {
                record.validationStatus = 'valid';
                record.validationErrors = [];
                validCount++;
            }

            await record.save();
        }

        // Update project counts
        await Project.findByIdAndUpdate(projectId, {
            validRecords: validCount,
            invalidRecords: invalidCount,
            status: 'validated',
        });

        res.json({ total: records.length, valid: validCount, invalid: invalidCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk delete records
// @route   DELETE /api/records/bulk
export const bulkDeleteRecords = async (req, res) => {
    try {
        const { ids, projectId } = req.body;
        const result = await Record.deleteMany({ _id: { $in: ids } });

        if (projectId) {
            await Project.findByIdAndUpdate(projectId, { $inc: { totalRecords: -result.deletedCount } });
        }

        res.json({ deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
