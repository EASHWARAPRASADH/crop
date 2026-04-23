import Order from '../models/Order.js';

// @desc    Create order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    try {
        const order = await Order.create({
            ...req.body,
            createdBy: req.user._id,
            history: [{ action: 'created', status: 'draft', user: req.user._id, details: 'Order created' }],
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get orders
// @route   GET /api/orders
export const getOrders = async (req, res) => {
    try {
        const { projectId, status } = req.query;
        const query = {};
        if (projectId) query.projectId = projectId;
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('projectId', 'name organization')
            .populate('templateId', 'name thumbnail')
            .populate('createdBy', 'name email')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('projectId')
            .populate('templateId')
            .populate('createdBy', 'name email')
            .populate('history.user', 'name');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, details } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        order.history.push({
            action: `status_changed_to_${status}`,
            status,
            user: req.user._id,
            details: details || `Status changed to ${status}`,
        });

        if (status === 'exported') {
            order.exportedAt = new Date();
        }

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        await order.deleteOne();
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
