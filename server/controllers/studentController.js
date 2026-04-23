import Student from '../models/Student.js';

// @desc    Get students (optionally by school or order)
// @route   GET /api/students
export const getStudents = async (req, res) => {
    try {
        const { schoolId, orderId, search, class: cls, section, page = 1, limit = 50 } = req.query;
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        if (orderId) query.orderId = orderId;
        if (cls) query.class = cls;
        if (section) query.section = section;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [students, total] = await Promise.all([
            Student.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
            Student.countDocuments(query),
        ]);
        res.json({ students, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create student
// @route   POST /api/students
export const createStudent = async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
export const updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk create students
// @route   POST /api/students/bulk
export const bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body;
        const created = await Student.insertMany(students);
        res.status(201).json({ inserted: created.length, students: created });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Count students for a school
// @route   GET /api/students/count/:schoolId
export const countStudents = async (req, res) => {
    try {
        const { orderId } = req.query;
        let query = { schoolId: req.params.schoolId };
        if (orderId) query.orderId = orderId;
        const count = await Student.countDocuments(query);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
