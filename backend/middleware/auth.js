import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hasPermission } from '../utils/helpers.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const allowed = permissions.some((p) => hasPermission(req.user.role, p));
  if (!allowed) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  next();
};

export const adminOnly = authorize('users:write', 'settings:write');
