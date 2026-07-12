import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';

const NOTIFICATION_SETTING_KEYS = [
  'notifyAtRisk',
  'notifyAttendance',
  'notifySystem',
  'emailNotifications',
  'atRiskThreshold',
];

const DEFAULT_NOTIFICATION_SETTINGS = {
  notifyAtRisk: true,
  notifyAttendance: true,
  notifySystem: true,
  emailNotifications: false,
  atRiskThreshold: 75,
};

export const formatNotification = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id?.toString() || obj.id,
    category: obj.category,
    title: obj.title,
    message: obj.message,
    timestamp: obj.createdAt || obj.timestamp,
    read: obj.read,
    dismissed: obj.dismissed,
    studentId: obj.studentId,
    studentName: obj.studentName,
    yearLevel: obj.yearLevel,
    section: obj.section,
    attendanceRate: obj.attendanceRate,
    action: obj.action,
  };
};

export const getNotificationSettings = async () => {
  const settings = await Settings.find({ key: { $in: NOTIFICATION_SETTING_KEYS } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...map };
};

export const shouldNotify = async (category) => {
  const settings = await getNotificationSettings();
  if (category === 'at_risk') return settings.notifyAtRisk !== false;
  if (category === 'attendance') return settings.notifyAttendance !== false;
  if (category === 'system') return settings.notifySystem !== false;
  return true;
};

export const createNotification = async (data, io = null) => {
  const enabled = await shouldNotify(data.category);
  if (!enabled) return null;

  const notification = await Notification.create(data);
  const formatted = formatNotification(notification);

  io?.emit('notification:new', { notification: formatted });

  return notification;
};

export const getNotifications = async ({ search, category, unreadOnly } = {}) => {
  const filter = { dismissed: false };

  if (unreadOnly === 'true' || unreadOnly === true) {
    filter.read = false;
  }

  if (category && category !== 'all' && category !== 'unread') {
    filter.category = category;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { message: regex }, { studentName: regex }];
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  return notifications.map(formatNotification);
};

export const getNotificationSummary = async () => {
  const active = await Notification.find({ dismissed: false });
  return {
    total: active.length,
    unread: active.filter((n) => !n.read).length,
    atRisk: active.filter((n) => n.category === 'at_risk').length,
    attendance: active.filter((n) => n.category === 'attendance').length,
    system: active.filter((n) => n.category === 'system').length,
  };
};

export const markNotificationRead = async (id) => {
  const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  return formatNotification(notification);
};

export const markAllNotificationsRead = async () => {
  await Notification.updateMany({ dismissed: false, read: false }, { read: true });
  return { success: true };
};

export const dismissNotification = async (id) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { dismissed: true, read: true },
    { new: true }
  );
  return formatNotification(notification);
};

export const clearReadNotifications = async () => {
  const result = await Notification.deleteMany({ read: true, dismissed: false });
  return { deleted: result.deletedCount };
};

export const notifyImportCompleted = async (importRecord, io) => {
  const errors = importRecord.anomaliesDetected || 0;
  await createNotification(
    {
      category: 'system',
      title: 'Biometric log upload succeeded',
      message: `${importRecord.fileName} — ${importRecord.totalRecords || 0} records imported with ${errors} anomal${errors === 1 ? 'y' : 'ies'}.`,
      action: { type: 'upload', path: '/admin/upload' },
      metadata: { importId: importRecord._id?.toString() },
    },
    io
  );
};

export const notifyImportFailed = async (fileName, errorMessage, io) => {
  await createNotification(
    {
      category: 'system',
      title: 'Biometric log upload failed',
      message: `${fileName} — ${errorMessage}`,
      action: { type: 'upload', path: '/admin/upload' },
    },
    io
  );
};

export const notifyAtRiskStudent = async (student, threshold, io) => {
  const rate = student.stats?.attendancePercentage ?? 0;
  const recent = await Notification.findOne({
    category: 'at_risk',
    studentId: student.studentId || student._id.toString(),
    dismissed: false,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  if (recent) return null;

  return createNotification(
    {
      category: 'at_risk',
      title: 'At-risk threshold reached',
      message: `${student.name} dropped below ${threshold}% attendance (${rate}%). Immediate follow-up recommended.`,
      studentId: student.studentId || student._id.toString(),
      studentName: student.name,
      yearLevel: student.yearLevel,
      attendanceRate: rate,
      action: {
        type: 'student',
        path: `/admin/students/${student.studentId || student._id.toString()}`,
      },
    },
    io
  );
};
