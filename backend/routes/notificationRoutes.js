import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  clearReadNotifications,
  dismissNotification,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';

const router = express.Router();

router.get('/', protect, authorize('notifications:read'), async (req, res) => {
  const notifications = await getNotifications(req.query);
  res.json({ success: true, count: notifications.length, notifications });
});

router.get('/summary', protect, authorize('notifications:read'), async (req, res) => {
  const summary = await getNotificationSummary();
  res.json({ success: true, summary });
});

router.patch('/read-all', protect, authorize('notifications:write'), async (req, res) => {
  await markAllNotificationsRead();
  res.json({ success: true });
});

router.delete('/read', protect, authorize('notifications:write'), async (req, res) => {
  const result = await clearReadNotifications();
  res.json({ success: true, ...result });
});

router.patch('/:id/read', protect, authorize('notifications:write'), async (req, res) => {
  const notification = await markNotificationRead(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ success: true, notification });
});

router.delete('/:id', protect, authorize('notifications:write'), async (req, res) => {
  const notification = await dismissNotification(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ success: true, notification });
});

export default router;
