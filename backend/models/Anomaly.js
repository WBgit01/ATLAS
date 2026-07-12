import mongoose from 'mongoose';

const anomalySchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    date: Date,
    message: { type: String, required: true },
    importBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportHistory' },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Anomaly', anomalySchema);
