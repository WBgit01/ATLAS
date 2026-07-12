import AttendanceRecord from '../models/AttendanceRecord.js';
import Student from '../models/Student.js';
import Settings from '../models/Settings.js';
import { getNotificationSettings, notifyAtRiskStudent } from './notificationService.js';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
};

const getSettings = async () => {
  const defaults = {
    lateThreshold: process.env.LATE_THRESHOLD || '08:00:00',
    earlyDepartureThreshold: process.env.EARLY_DEPARTURE_THRESHOLD || '17:00:00',
    defaultServiceHours: Number(process.env.DEFAULT_SERVICE_HOURS) || 400,
    workingDaysPerMonth: 22,
  };

  const settings = await Settings.find({
    key: { $in: ['lateThreshold', 'earlyDepartureThreshold', 'defaultServiceHours', 'workingDaysPerMonth', 'atRiskThreshold'] },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return { ...defaults, ...map };
};

export const recalculateStudentStats = async (studentId, io = null) => {
  const student = await Student.findById(studentId);
  if (!student) return null;

  const previousRate = student.stats?.attendancePercentage ?? 0;
  const settings = await getSettings();
  const lateThreshold = parseTimeToMinutes(settings.lateThreshold);
  const earlyThreshold = parseTimeToMinutes(settings.earlyDepartureThreshold);

  const records = await AttendanceRecord.find({ student: studentId }).sort({ date: 1 });

  let totalPresentDays = 0;
  let totalAbsentDays = 0;
  let totalLateArrivals = 0;
  let totalEarlyDepartures = 0;
  let totalHoursRendered = 0;

  for (const record of records) {
    if (record.status === 'present' || record.status === 'late' || record.status === 'early_departure') {
      totalPresentDays += 1;
    } else if (record.status === 'absent') {
      totalAbsentDays += 1;
    } else if (record.status === 'incomplete') {
      totalAbsentDays += 1;
    }

    totalHoursRendered += record.hoursRendered || 0;

    const timeInMin = parseTimeToMinutes(record.timeIn);
    const timeOutMin = parseTimeToMinutes(record.timeOut);

    if (timeInMin !== null && lateThreshold !== null && timeInMin > lateThreshold) {
      record.isLate = true;
      record.lateMinutes = timeInMin - lateThreshold;
      totalLateArrivals += 1;
      if (record.status === 'present') record.status = 'late';
    }

    if (timeOutMin !== null && earlyThreshold !== null && timeOutMin < earlyThreshold && record.hoursRendered > 0) {
      record.isEarlyDeparture = true;
      record.earlyMinutes = earlyThreshold - timeOutMin;
      totalEarlyDepartures += 1;
    }

    await record.save();
  }

  const totalDays = totalPresentDays + totalAbsentDays;
  const attendancePercentage = totalDays > 0 ? Math.round((totalPresentDays / totalDays) * 10000) / 100 : 0;
  const averageDailyHours =
    totalPresentDays > 0 ? Math.round((totalHoursRendered / totalPresentDays) * 100) / 100 : 0;
  const remainingServiceHours = Math.max(
    0,
    Math.round((student.requiredServiceHours - totalHoursRendered) * 100) / 100
  );

  student.stats = {
    totalPresentDays,
    totalAbsentDays,
    totalLateArrivals,
    totalEarlyDepartures,
    totalHoursRendered: Math.round(totalHoursRendered * 100) / 100,
    averageDailyHours,
    attendancePercentage,
    remainingServiceHours,
  };

  await student.save();

  const notificationSettings = await getNotificationSettings();
  const threshold = notificationSettings.atRiskThreshold ?? 75;
  if (
    attendancePercentage < threshold &&
    previousRate >= threshold &&
    student.isActive
  ) {
    await notifyAtRiskStudent(student, threshold, io);
  }

  return student;
};

export const getInstitutionAnalytics = async (filters = {}) => {
  const match = { isActive: true };
  if (filters.department) match.department = filters.department;
  if (filters.course) match.course = filters.course;
  if (filters.yearLevel) match.yearLevel = filters.yearLevel;

  const students = await Student.find(match).lean();
  const studentIds = students.map((s) => s._id);
  const notificationSettings = await getNotificationSettings();
  const atRiskThreshold = notificationSettings.atRiskThreshold ?? 75;

  const recordMatch = { student: { $in: studentIds } };
  if (filters.startDate || filters.endDate) {
    recordMatch.date = {};
    if (filters.startDate) recordMatch.date.$gte = new Date(filters.startDate);
    if (filters.endDate) recordMatch.date.$lte = new Date(filters.endDate);
  }

  const records = await AttendanceRecord.find(recordMatch).lean();

  const monthlyTrends = {};
  const departmentStats = {};

  for (const record of records) {
    const monthKey = new Date(record.date).toISOString().slice(0, 7);
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = { month: monthKey, presentDays: 0, hours: 0, records: 0 };
    }
    monthlyTrends[monthKey].records += 1;
    monthlyTrends[monthKey].hours += record.hoursRendered || 0;
    if (['present', 'late', 'early_departure'].includes(record.status)) {
      monthlyTrends[monthKey].presentDays += 1;
    }
  }

  for (const student of students) {
    const dept = student.department || 'Unassigned';
    if (!departmentStats[dept]) {
      departmentStats[dept] = {
        department: dept,
        students: 0,
        totalHours: 0,
        avgAttendance: 0,
        attendanceSum: 0,
      };
    }
    departmentStats[dept].students += 1;
    departmentStats[dept].totalHours += student.stats?.totalHoursRendered || 0;
    departmentStats[dept].attendanceSum += student.stats?.attendancePercentage || 0;
  }

  const departmentComparison = Object.values(departmentStats).map((d) => ({
    ...d,
    avgAttendance: d.students > 0 ? Math.round((d.attendanceSum / d.students) * 100) / 100 : 0,
    totalHours: Math.round(d.totalHours * 100) / 100,
  }));

  const topPerformers = [...students]
    .sort((a, b) => (b.stats?.attendancePercentage || 0) - (a.stats?.attendancePercentage || 0))
    .slice(0, 10)
    .map((s) => ({
      id: s._id,
      name: s.name,
      department: s.department,
      attendancePercentage: s.stats?.attendancePercentage || 0,
      totalHoursRendered: s.stats?.totalHoursRendered || 0,
    }));

  const deficiencies = [...students]
    .filter(
      (s) =>
        (s.stats?.attendancePercentage || 0) < atRiskThreshold ||
        (s.stats?.remainingServiceHours || 0) > s.requiredServiceHours * 0.5
    )
    .sort((a, b) => (a.stats?.attendancePercentage || 0) - (b.stats?.attendancePercentage || 0))
    .slice(0, 10)
    .map((s) => ({
      id: s._id,
      name: s.name,
      department: s.department,
      attendancePercentage: s.stats?.attendancePercentage || 0,
      remainingServiceHours: s.stats?.remainingServiceHours || 0,
    }));

  const totals = students.reduce(
    (acc, s) => {
      acc.totalStudents += 1;
      acc.totalPresentDays += s.stats?.totalPresentDays || 0;
      acc.totalAbsentDays += s.stats?.totalAbsentDays || 0;
      acc.totalLateArrivals += s.stats?.totalLateArrivals || 0;
      acc.totalEarlyDepartures += s.stats?.totalEarlyDepartures || 0;
      acc.totalHoursRendered += s.stats?.totalHoursRendered || 0;
      return acc;
    },
    {
      totalStudents: 0,
      totalPresentDays: 0,
      totalAbsentDays: 0,
      totalLateArrivals: 0,
      totalEarlyDepartures: 0,
      totalHoursRendered: 0,
    }
  );

  totals.totalHoursRendered = Math.round(totals.totalHoursRendered * 100) / 100;
  totals.averageDailyHours =
    totals.totalPresentDays > 0
      ? Math.round((totals.totalHoursRendered / totals.totalPresentDays) * 100) / 100
      : 0;
  totals.attendancePercentage =
    totals.totalPresentDays + totals.totalAbsentDays > 0
      ? Math.round(
          (totals.totalPresentDays / (totals.totalPresentDays + totals.totalAbsentDays)) * 10000
        ) / 100
      : 0;

  return {
    totals,
    monthlyTrends: Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month)),
    departmentComparison,
    topPerformers,
    deficiencies,
    attendanceBreakdown: [
      { name: 'Present', value: totals.totalPresentDays },
      { name: 'Absent', value: totals.totalAbsentDays },
      { name: 'Late', value: totals.totalLateArrivals },
      { name: 'Early Departure', value: totals.totalEarlyDepartures },
    ],
  };
};

export const getStudentWeeklyMonthly = async (studentId) => {
  const records = await AttendanceRecord.find({ student: studentId }).sort({ date: 1 }).lean();

  const weekly = {};
  const monthly = {};

  for (const record of records) {
    const date = new Date(record.date);
    const monthKey = date.toISOString().slice(0, 7);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!weekly[weekKey]) weekly[weekKey] = { week: weekKey, hours: 0, days: 0 };
    if (!monthly[monthKey]) monthly[monthKey] = { month: monthKey, hours: 0, days: 0 };

    weekly[weekKey].hours += record.hoursRendered || 0;
    monthly[monthKey].hours += record.hoursRendered || 0;

    if (['present', 'late', 'early_departure'].includes(record.status)) {
      weekly[weekKey].days += 1;
      monthly[monthKey].days += 1;
    }
  }

  return {
    weekly: Object.values(weekly),
    monthly: Object.values(monthly),
  };
};
