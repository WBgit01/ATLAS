import express from 'express';
import AttendanceRecord from '../models/AttendanceRecord.js';
import { protect, authorize } from '../middleware/auth.js';
import { getInstitutionAnalytics } from '../services/analyticsService.js';
import { createAuditLog } from '../services/auditService.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('attendance:read'), async (req, res) => {
  const analytics = await getInstitutionAnalytics(req.query);
  res.json(analytics);
});

router.get('/records', protect, authorize('attendance:read'), async (req, res) => {
  const { student, startDate, endDate, status, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (student) filter.student = student;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    AttendanceRecord.find(filter)
      .populate('student', 'name department studentId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AttendanceRecord.countDocuments(filter),
  ]);

  res.json({ records, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

router.put('/records/:id', protect, authorize('attendance:write'), async (req, res) => {
  const record = await AttendanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) return res.status(404).json({ message: 'Record not found' });

  await createAuditLog({
    user: req.user,
    action: 'update_attendance',
    resource: 'attendance',
    resourceId: record._id,
    details: req.body,
    req,
  });

  res.json(record);
});

export default router;
