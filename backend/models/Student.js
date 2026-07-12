import mongoose from 'mongoose';
import { normalizeName } from '../utils/helpers.js';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, trim: true, sparse: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    course: { type: String, trim: true },
    yearLevel: { type: String, trim: true },
    department: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    enrollmentStatus: {
      type: String,
      enum: ['enrolled', 'dropped', 'transferred'],
      default: 'enrolled',
    },
    requiredServiceHours: { type: Number, default: 400 },
    deviceUserId: { type: String },
    isActive: { type: Boolean, default: true },
    stats: {
      totalPresentDays: { type: Number, default: 0 },
      totalAbsentDays: { type: Number, default: 0 },
      totalLateArrivals: { type: Number, default: 0 },
      totalEarlyDepartures: { type: Number, default: 0 },
      totalHoursRendered: { type: Number, default: 0 },
      averageDailyHours: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
      remainingServiceHours: { type: Number, default: 400 },
    },
  },
  { timestamps: true }
);

studentSchema.pre('save', function setNormalizedName(next) {
  this.normalizedName = normalizeName(this.name);
  next();
});

studentSchema.index({ normalizedName: 1 });
studentSchema.index({ department: 1, course: 1 });

export default mongoose.model('Student', studentSchema);
