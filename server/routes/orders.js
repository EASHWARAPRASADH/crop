import express from 'express';
import { createOrder, getOrders, getOrder, updateOrderStatus, deleteOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder).delete(deleteOrder);
router.put('/:id/status', updateOrderStatus);

export default router;
