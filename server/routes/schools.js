import express from 'express';
import { getSchools, getSchoolById, getSchoolByUser, createSchool, updateSchool, toggleVerifySchool, deleteSchool } from '../controllers/schoolController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSchools).post(createSchool);
router.route('/:id').get(getSchoolById).put(updateSchool).delete(deleteSchool);
router.get('/user/:userId', getSchoolByUser);
router.put('/:id/verify', toggleVerifySchool);

export default router;
