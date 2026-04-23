import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: { type: String, default: '' },
    area: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

schoolSchema.index({ email: 1 });
schoolSchema.index({ name: 'text' });

export default mongoose.model('School', schoolSchema);
