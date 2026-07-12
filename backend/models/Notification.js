import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['at_risk', 'attendance', 'system'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    dismissed: { type: Boolean, default: false, index: true },
    studentId: String,
    studentName: String,
    yearLevel: String,
    section: String,
    attendanceRate: Number,
    action: {
      type: { type: String },
      path: String,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
