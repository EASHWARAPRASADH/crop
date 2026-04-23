import mongoose from 'mongoose';

const fontSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    family: { type: String, required: true },
    category: {
        type: String,
        enum: ['sans-serif', 'serif', 'display', 'handwriting', 'monospace', 'decorative', 'corporate', 'academic', 'modern', 'minimal'],
        default: 'sans-serif'
    },
    source: { type: String, enum: ['google', 'custom', 'preloaded'], default: 'google' },
    variants: [String],  // ['regular', '500', '600', '700', 'italic']
    fileUrl: { type: String, default: '' },  // For custom uploads
    previewText: { type: String, default: 'The quick brown fox jumps over the lazy dog' },
    isFavorite: { type: Boolean, default: false },
    favoriteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    useCount: { type: Number, default: 0 },
    pairsWith: [String],  // Suggested font pairings
}, { timestamps: true });

fontSchema.index({ name: 'text', family: 'text' });
fontSchema.index({ category: 1, source: 1 });

export default mongoose.model('Font', fontSchema);
