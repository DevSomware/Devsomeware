import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    testUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestUsers',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkInTime: {
        type: Date,
        required: true
    },
    checkOutTime: {
        type: Date,
        required: false
    },
    duration: {
        type: Number, 
        required: false
    },
    status: {
        type: String,
        enum: ['present', 'half-day', 'absent'],
        default: 'present'
    },
    lastAction: {
        type: String,
        enum: ['check-in', 'check-out'],
        default: 'check-in'
    },
    verified: {
        type: Boolean,
        default: true
    },
    verificationMethod: {
        type: String,
        enum: ['manual', 'auto'],
        default: 'auto'
    },
    notes: {
        type: String,
        required: false
    }
}, { timestamps: true });

AttendanceSchema.index({ email: 1, date: 1 });
AttendanceSchema.index({ testUserId: 1, date: 1 });
AttendanceSchema.index({ date: 1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);