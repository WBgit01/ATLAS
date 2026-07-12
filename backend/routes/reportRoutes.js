import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Student from '../models/Student.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import AuditLog from '../models/AuditLog.js';
import Settings from '../models/Settings.js';
import { protect, authorize } from '../middleware/auth.js';
import { getInstitutionAnalytics } from '../services/analyticsService.js';
import { createAuditLog } from '../services/auditService.js';

const router = express.Router();

router.get('/attendance/excel', protect, authorize('reports:export'), async (req, res) => {
  const { department, startDate, endDate } = req.query;
  const filter = { isActive: true };
  if (department) filter.department = department;

  const students = await Student.find(filter).sort({ name: 1 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance Report');

  sheet.columns = [
    { header: 'Student ID', key: 'studentId', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Department', key: 'department', width: 15 },
    { header: 'Course', key: 'course', width: 15 },
    { header: 'Present Days', key: 'present', width: 12 },
    { header: 'Absent Days', key: 'absent', width: 12 },
    { header: 'Late Arrivals', key: 'late', width: 12 },
    { header: 'Total Hours', key: 'hours', width: 12 },
    { header: 'Attendance %', key: 'percentage', width: 12 },
    { header: 'Remaining Hours', key: 'remaining', width: 15 },
  ];

  for (const student of students) {
    sheet.addRow({
      studentId: student.studentId || '',
      name: student.name,
      department: student.department || '',
      course: student.course || '',
      present: student.stats?.totalPresentDays || 0,
      absent: student.stats?.totalAbsentDays || 0,
      late: student.stats?.totalLateArrivals || 0,
      hours: student.stats?.totalHoursRendered || 0,
      percentage: student.stats?.attendancePercentage || 0,
      remaining: student.stats?.remainingServiceHours || 0,
    });
  }

  await createAuditLog({
    user: req.user,
    action: 'export_excel',
    resource: 'report',
    details: { department, startDate, endDate },
    req,
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

router.get('/attendance/pdf', protect, authorize('reports:export'), async (req, res) => {
  const analytics = await getInstitutionAnalytics(req.query);
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance-summary.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Attendance Analytics Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.text(`Total Students: ${analytics.totals.totalStudents}`);
  doc.text(`Total Present Days: ${analytics.totals.totalPresentDays}`);
  doc.text(`Total Absent Days: ${analytics.totals.totalAbsentDays}`);
  doc.text(`Total Hours Rendered: ${analytics.totals.totalHoursRendered}`);
  doc.text(`Attendance Percentage: ${analytics.totals.attendancePercentage}%`);
  doc.moveDown();
  doc.text('Top Performers:', { underline: true });
  analytics.topPerformers.forEach((s, i) => {
    doc.text(`${i + 1}. ${s.name} - ${s.attendancePercentage}%`);
  });
  doc.end();

  await createAuditLog({
    user: req.user,
    action: 'export_pdf',
    resource: 'report',
    details: req.query,
    req,
  });
});

router.get('/audit-logs', protect, authorize('users:read'), async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(),
  ]);
  res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

router.get('/settings', protect, authorize('settings:read'), async (req, res) => {
  const settings = await Settings.find();
  res.json(settings);
});

router.put('/settings', protect, authorize('settings:write'), async (req, res) => {
  const { settings } = req.body;
  const updated = [];

  for (const item of settings || []) {
    const setting = await Settings.findOneAndUpdate(
      { key: item.key },
      { value: item.value, description: item.description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    updated.push(setting);
  }

  await createAuditLog({
    user: req.user,
    action: 'update_settings',
    resource: 'settings',
    details: settings,
    req,
  });

  res.json(updated);
});

export default router;
