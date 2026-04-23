import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, default: '' },
    class: { type: String, default: '' },
    section: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    fatherName: { type: String, default: '' },
    motherName: { type: String, default: '' },
}, { timestamps: true });

studentSchema.index({ schoolId: 1 });
studentSchema.index({ orderId: 1 });
studentSchema.index({ name: 'text', rollNumber: 'text' });

export default mongoose.model('Student', studentSchema);
