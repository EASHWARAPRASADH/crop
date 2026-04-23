import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import templateRoutes from './routes/templates.js';
import recordRoutes from './routes/records.js';
import orderRoutes from './routes/orders.js';
import fontRoutes from './routes/fonts.js';
import uploadRoutes from './routes/upload.js';
import exportRoutes from './routes/export.js';
import schoolRoutes from './routes/schools.js';
import studentRoutes from './routes/students.js';
import advertisementRoutes from './routes/advertisements.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/fonts', fontRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/ai', aiRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const mongoose = (await import('mongoose')).default;
        const User = (await import('./models/User.js')).default;
        const Template = (await import('./models/Template.js')).default;
        const Record = (await import('./models/Record.js')).default;
        const Order = (await import('./models/Order.js')).default;
        const Project = (await import('./models/Project.js')).default;

        const [users, templates, records, orders, projects] = await Promise.all([
            User.countDocuments(),
            Template.countDocuments(),
            Record.countDocuments(),
            Order.countDocuments(),
            Project.countDocuments(),
        ]);

        const pendingValidations = await Record.countDocuments({ validationStatus: 'pending' });
        const generatingOrders = await Order.countDocuments({ status: 'generating' });

        // Cards generated today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cardsToday = await Record.countDocuments({
            cardGenerated: true,
            updatedAt: { $gte: today },
        });

        res.json({
            totalUsers: users,
            totalTemplates: templates,
            totalRecords: records,
            totalOrders: orders,
            totalProjects: projects,
            cardsGeneratedToday: cardsToday,
            pendingValidations,
            processingQueue: generatingOrders,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 GOTEK API running on port ${PORT}`);
    });
});
