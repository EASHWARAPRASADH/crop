import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

advertisementSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.model('Advertisement', advertisementSchema);
