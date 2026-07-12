import mongoose from 'mongoose';

const importHistorySchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    filePath: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    periodStart: Date,
    periodEnd: Date,
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'partial'],
      default: 'processing',
    },
    totalRecords: { type: Number, default: 0 },
    matchedStudents: { type: Number, default: 0 },
    unmatchedStudents: { type: Number, default: 0 },
    newStudentsCreated: { type: Number, default: 0 },
    anomaliesDetected: { type: Number, default: 0 },
    errorMessage: String,
    summary: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('ImportHistory', importHistorySchema);
