const mongoose = require('mongoose');
// The logged-in user's notifications (bell menu).
const Notification = require('../models/Notification');

const toResponse = (n) => ({
  _id: n._id,
  type: n.type,
  title: n.title,
  message: n.message,
  activity: n.activity ? String(n.activity) : null,
  read: Boolean(n.readAt),
  createdAt: n.createdAt,
});

// GET /api/notifications  -> latest 50 + unread count
exports.getMyNotifications = async (req, res) => {
  try {
    const [items, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
      Notification.countDocuments({ user: req.user._id, readAt: null }),
    ]);
    res.json({ notifications: items.map(toResponse), unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Could not load notifications.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update notifications.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id, readAt: null }, { readAt: new Date() });
    res.json({ message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update the notification.' });
  }
};

// DELETE /api/notifications  -> clear all of my notifications
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'Notifications cleared.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not clear notifications.' });
  }
};

// DELETE /api/notifications/:id  -> delete one of my notifications
exports.deleteOne = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    // Only the owner's notification can be deleted.
    const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete the notification.' });
  }
};
