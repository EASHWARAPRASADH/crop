import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    organization: { type: String, default: '' },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Template mapping
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
    templateMode: { type: String, enum: ['single', 'multiple'], default: 'single' },

    // Multi-template mapping rules
    templateRules: [{
        field: String,        // e.g., 'department'
        value: String,        // e.g., 'Engineering'
        templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' }
    }],

    // Field mapping (Excel columns → template placeholders)
    fieldMapping: { type: Map, of: String, default: {} },

    // Card configuration
    cardSize: { type: String, enum: ['cr80', 'horizontal', 'vertical', 'a4', 'custom'], default: 'cr80' },
    customWidth: { type: Number, default: 0 },
    customHeight: { type: Number, default: 0 },

    // Print layout
    printLayout: {
        sheetSize: { type: String, enum: ['a4', 'a3', 'custom'], default: 'a4' },
        rows: { type: Number, default: 2 },
        columns: { type: Number, default: 5 },
        margins: { top: Number, right: Number, bottom: Number, left: Number },
        spacing: { horizontal: Number, vertical: Number },
        bleed: { type: Number, default: 0 },
        cropMarks: { type: Boolean, default: true },
    },

    // Lifecycle
    status: {
        type: String,
        enum: ['draft', 'template_selected', 'data_imported', 'validated', 'generated', 'exported', 'archived'],
        default: 'draft'
    },

    totalRecords: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    invalidRecords: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
