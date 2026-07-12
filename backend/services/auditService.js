import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  user,
  action,
  resource,
  resourceId,
  details,
  req,
}) => {
  try {
    await AuditLog.create({
      user: user?._id,
      userEmail: user?.email,
      action,
      resource,
      resourceId: resourceId?.toString(),
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};
