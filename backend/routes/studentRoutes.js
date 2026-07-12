import express from 'express';
import Student from '../models/Student.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import { protect, authorize } from '../middleware/auth.js';
import { normalizeName } from '../utils/helpers.js';
import { recalculateStudentStats, getStudentWeeklyMonthly } from '../services/analyticsService.js';
import { createAuditLog } from '../services/auditService.js';

const router = express.Router();

router.get('/', protect, authorize('students:read'), async (req, res) => {
  const { search, department, course, yearLevel, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (course) filter.course = course;
  if (yearLevel) filter.yearLevel = yearLevel;

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    Student.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Student.countDocuments(filter),
  ]);

  res.json({ students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

router.get('/filters', protect, authorize('students:read'), async (req, res) => {
  const [departments, courses, yearLevels] = await Promise.all([
    Student.distinct('department', { isActive: true, department: { $ne: null, $ne: '' } }),
    Student.distinct('course', { isActive: true, course: { $ne: null, $ne: '' } }),
    Student.distinct('yearLevel', { isActive: true, yearLevel: { $ne: null, $ne: '' } }),
  ]);
  res.json({ departments, courses, yearLevels });
});

router.get('/archive/summary', protect, authorize('students:read'), async (req, res) => {
  const archived = await Student.find({ isActive: false }).select('stats.attendancePercentage');
  const total = archived.length;
  const graduated = archived.filter((s) => (s.stats?.attendancePercentage ?? 0) >= 85).length;
  const transferred = 0;
  const dropped = total - graduated;

  res.json({
    summary: { total, graduated, transferred, dropped },
  });
});

router.get('/archive', protect, authorize('students:read'), async (req, res) => {
  const { search, batch, status } = req.query;
  const filter = { isActive: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
  }
  if (batch && batch !== 'all') filter.yearLevel = batch;

  const records = await Student.find(filter).sort({ updatedAt: -1 });

  let students = records.map((student) => {
    const rate = student.stats?.attendancePercentage ?? 0;
    let archiveStatus = 'dropped';
    if (rate >= 85) archiveStatus = 'graduated';
    else if (rate >= 70) archiveStatus = 'transferred';

    return {
      id: student.studentId || student._id.toString(),
      name: student.name,
      batch: student.yearLevel || student.course || '—',
      status: archiveStatus,
      finalAttendanceRate: rate,
      archivedDate: student.updatedAt,
    };
  });

  if (status && status !== 'all') {
    students = students.filter((student) => student.status === status);
  }

  res.json({ students });
});

router.patch('/:id/enrollment-status', protect, authorize('students:write'), async (req, res) => {
  try {
    const { enrollmentStatus } = req.body;
    const validStatuses = ['enrolled', 'dropped', 'transferred'];

    if (!validStatuses.includes(enrollmentStatus)) {
      return res.status(400).json({ message: 'Invalid enrollment status' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { enrollmentStatus },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ message: 'Student not found' });

    await createAuditLog({
      user: req.user,
      action: 'update_enrollment_status',
      resource: 'student',
      resourceId: student._id,
      details: { enrollmentStatus },
      req,
    });

    res.json({ student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', protect, authorize('students:read'), async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const [records, trends] = await Promise.all([
    AttendanceRecord.find({ student: student._id }).sort({ date: -1 }).limit(100),
    getStudentWeeklyMonthly(student._id),
  ]);

  res.json({ student, records, trends });
});

router.post('/', protect, authorize('students:write'), async (req, res) => {
  try {
    const data = { ...req.body, normalizedName: normalizeName(req.body.name) };
    const student = await Student.create(data);
    await createAuditLog({
      user: req.user,
      action: 'create_student',
      resource: 'student',
      resourceId: student._id,
      details: { name: student.name },
      req,
    });
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, authorize('students:write'), async (req, res) => {
  try {
    const updates = { ...req.body };
    // Name is the import match key (normalizedName); do not allow renames via API.
    delete updates.name;
    delete updates.normalizedName;
    delete updates.enrollmentStatus;
    updates.course = 'Bachelor of Science in Nursing';

    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    await recalculateStudentStats(student._id);
    await createAuditLog({
      user: req.user,
      action: 'update_student',
      resource: 'student',
      resourceId: student._id,
      details: updates,
      req,
    });

    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, authorize('students:write'), async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  await createAuditLog({
    user: req.user,
    action: 'deactivate_student',
    resource: 'student',
    resourceId: student._id,
    req,
  });

  res.json({ message: 'Student deactivated' });
});

router.post('/bulk', protect, authorize('students:write'), async (req, res) => {
  try {
    const { students } = req.body;
    const created = [];

    for (const item of students || []) {
      const student = await Student.create({
        ...item,
        normalizedName: normalizeName(item.name),
        requiredServiceHours: item.requiredServiceHours || Number(process.env.DEFAULT_SERVICE_HOURS) || 400,
      });
      created.push(student);
    }

    await createAuditLog({
      user: req.user,
      action: 'bulk_import_students',
      resource: 'student',
      details: { count: created.length },
      req,
    });

    res.status(201).json({ created: created.length, students: created });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
