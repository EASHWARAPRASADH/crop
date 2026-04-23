import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Order details
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    totalCards: { type: Number, default: 0 },
    generatedCards: { type: Number, default: 0 },

    // Options
    printSides: { type: String, enum: ['front', 'front_back'], default: 'front_back' },
    outputFormat: { type: String, enum: ['single_pdf', 'multiple_pdf', 'png', 'zip'], default: 'single_pdf' },

    // Sheet layout
    sheetSize: { type: String, enum: ['a4', 'a3', 'custom'], default: 'a4' },
    cardsPerSheet: { type: Number, default: 10 },

    // Lifecycle
    status: {
        type: String,
        enum: ['draft', 'uploaded', 'validated', 'approved', 'generating', 'generated', 'exported', 'archived'],
        default: 'draft'
    },

    // Tracking
    history: [{
        action: String,
        status: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String,
    }],

    // Export
    exportUrl: { type: String, default: '' },
    exportedAt: { type: Date },

    notes: { type: String, default: '' },
}, { timestamps: true });

orderSchema.index({ projectId: 1, status: 1 });
orderSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
