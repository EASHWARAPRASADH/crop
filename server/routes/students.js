import express from 'express';
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, bulkCreateStudents, countStudents } from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getStudents).post(createStudent);
router.post('/bulk', bulkCreateStudents);
router.get('/count/:schoolId', countStudents);
router.route('/:id').get(getStudentById).put(updateStudent).delete(deleteStudent);

export default router;
