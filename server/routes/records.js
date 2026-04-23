import express from 'express';
import { createRecord, getRecords, getRecord, updateRecord, deleteRecord, bulkCreateRecords, validateRecords, bulkDeleteRecords } from '../controllers/recordController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/bulk', bulkCreateRecords);
router.delete('/bulk', bulkDeleteRecords);
router.post('/validate/:projectId', validateRecords);
router.route('/').get(getRecords).post(createRecord);
router.route('/:id').get(getRecord).put(updateRecord).delete(deleteRecord);

export default router;
