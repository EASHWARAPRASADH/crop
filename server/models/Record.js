import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

    // Core fields
    name: { type: String, required: true, trim: true },
    idNumber: { type: String, default: '' },
    department: { type: String, default: '' },
    class: { type: String, default: '' },
    designation: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    validUntil: { type: String, default: '' },
    issueDate: { type: String, default: '' },

    // Photo
    photoUrl: { type: String, default: '' },
    photoProcessed: { type: Boolean, default: false },
    photoOriginal: { type: String, default: '' },

    // Extra custom fields (dynamic)
    customFields: { type: Map, of: String, default: {} },

    // Validation
    validationStatus: {
        type: String,
        enum: ['valid', 'invalid', 'pending'],
        default: 'pending'
    },
    validationErrors: [String],

    // Generation
    cardGenerated: { type: Boolean, default: false },
    cardUrl: { type: String, default: '' },

    // Template override (for multi-template mode)
    templateOverride: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
}, { timestamps: true });

// Indexes for fast querying
recordSchema.index({ projectId: 1, validationStatus: 1 });
recordSchema.index({ projectId: 1, idNumber: 1 });
recordSchema.index({ name: 'text', idNumber: 'text' });

export default mongoose.model('Record', recordSchema);
