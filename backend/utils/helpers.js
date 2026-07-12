export const normalizeName = (name = '') =>
  String(name).trim().toLowerCase().replace(/\s+/g, ' ');

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  VIEWER: 'viewer',
};

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  staff: [
    'students:read',
    'students:write',
    'attendance:read',
    'attendance:write',
    'imports:read',
    'imports:write',
    'reports:read',
    'reports:export',
    'anomalies:read',
    'anomalies:resolve',
    'settings:read',
    'notifications:read',
    'notifications:write',
  ],
  viewer: [
    'students:read',
    'attendance:read',
    'imports:read',
    'reports:read',
    'anomalies:read',
    'settings:read',
    'notifications:read',
  ],
};

export const hasPermission = (role, permission) => {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
};
