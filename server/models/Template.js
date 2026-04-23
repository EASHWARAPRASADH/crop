import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    // Classification
    category: {
        type: String,
        enum: [
            'school', 'college', 'university', 'corporate', 'employee', 'hospital',
            'event', 'visitor', 'government', 'security', 'library', 'gym',
            'club', 'conference', 'volunteer', 'transport', 'teacher', 'industrial',
            'startup', 'hotel', 'airport', 'construction', 'ngo', 'training',
            'coaching', 'retail', 'warehouse', 'delivery', 'tech', 'bank',
            'police', 'medical', 'internship', 'campus', 'membership', 'bus_pass',
            'sports', 'media', 'vip', 'access_control'
        ],
        default: 'school'
    },
    style: {
        type: String,
        enum: [
            'minimal', 'corporate', 'modern', 'gradient', 'dark', 'glassmorphism',
            'neumorphism', 'material', 'classic', 'luxury', 'colorful', 'flat',
            'creative', 'tech', 'futuristic'
        ],
        default: 'modern'
    },

    // Card dimensions
    cardSize: { type: String, enum: ['cr80', 'horizontal', 'vertical', 'a4', 'custom'], default: 'cr80' },
    width: { type: Number, default: 638 },   // CR80 at 150 DPI
    height: { type: Number, default: 1013 },  // CR80 at 150 DPI

    // Design data (Fabric.js JSON)
    frontDesign: { type: mongoose.Schema.Types.Mixed, default: {} },
    backDesign: { type: mongoose.Schema.Types.Mixed, default: null },
    hasTwoSides: { type: Boolean, default: false },

    // Template thumbnail
    thumbnail: { type: String, default: '' },

    // Dynamic fields used
    dynamicFields: [String],

    // Colors used in template
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#60A5FA' },
    accentColor: { type: String, default: '#EF4444' },

    // Metadata
    isPublic: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    useCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },

    tags: [String],
}, { timestamps: true });

// Indexes for search and filtering
templateSchema.index({ name: 'text', description: 'text', tags: 'text' });
templateSchema.index({ category: 1, style: 1 });
templateSchema.index({ isPublic: 1, useCount: -1 });

export default mongoose.model('Template', templateSchema);
