import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

export const ensureDefaultAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@atl.edu';
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(adminPassword, 12);
  await User.create({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    password: hashed,
    role: 'admin',
  });

  console.log(`Default admin created: ${adminEmail}`);
  return true;
};

export const ensureDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'defaultServiceHours',
      value: Number(process.env.DEFAULT_SERVICE_HOURS) || 400,
      description: 'Default required service hours',
    },
    {
      key: 'lateThreshold',
      value: process.env.LATE_THRESHOLD || '08:00:00',
      description: 'Late arrival threshold',
    },
    {
      key: 'earlyDepartureThreshold',
      value: process.env.EARLY_DEPARTURE_THRESHOLD || '17:00:00',
      description: 'Early departure threshold',
    },
    { key: 'workingDaysPerMonth', value: 22, description: 'Expected working days per month' },
    { key: 'atRiskThreshold', value: 75, description: 'Attendance percentage below which students are flagged as at-risk' },
    { key: 'notifyAtRisk', value: true, description: 'Send notifications when students fall below at-risk threshold' },
    { key: 'notifyAttendance', value: true, description: 'Send notifications for attendance summaries and alerts' },
    { key: 'notifySystem', value: true, description: 'Send notifications for system events like imports' },
    { key: 'emailNotifications', value: false, description: 'Send notification copies to admin email' },
  ];

  for (const setting of defaultSettings) {
    await Settings.findOneAndUpdate({ key: setting.key }, setting, { upsert: true });
  }
};

export const bootstrapDatabase = async () => {
  await ensureDefaultAdmin();
  await ensureDefaultSettings();
};
