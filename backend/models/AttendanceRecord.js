import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: Date, required: true, index: true },
    timeIn: String,
    timeOut: String,
    punches: [String],
    hoursRendered: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'incomplete', 'late', 'early_departure', 'flagged'],
      default: 'present',
    },
    flags: [String],
    isLate: { type: Boolean, default: false },
    isEarlyDeparture: { type: Boolean, default: false },
    lateMinutes: { type: Number, default: 0 },
    earlyMinutes: { type: Number, default: 0 },
    importBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportHistory' },
    sourceFile: String,
    beforeNoonIn: String,
    beforeNoonOut: String,
    afterNoonIn: String,
    afterNoonOut: String,
    overtimeIn: String,
    overtimeOut: String,
    reviewed: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ student: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
