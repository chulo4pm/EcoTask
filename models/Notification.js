// In-app notification shown in a user's bell (announcements, activity changes, approvals...).
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'announcement',          // volunteer: admin posted an announcement
      'activity_published',    // volunteer: an organizer posted a new activity
      'activity_updated',      // volunteer: an activity they joined was changed
      'activity_cancelled',    // volunteer: an activity they joined was cancelled
      'attendance_marked',     // volunteer: organizer marked their attendance
      'organizer_approved',    // organizer: application approved
      'organizer_rejected',    // organizer: application rejected
      'volunteer_joined',      // organizer: a volunteer joined their activity
      'organizer_application', // admin: a new organizer application needs review
      'report_reviewed',       // volunteer: the admin reviewed their report
      'activity_hidden',       // organizer: the admin hid one of their activities
      'activity_deleted',      // organizer: the admin deleted one of their activities (with a reason)
      'activity_unhidden',     // organizer: the admin made it visible again
      'activity_reported',     // organizer: a volunteer reported their activity (reporter stays anonymous)
      'report_submitted',      // admin: a new report needs review
      'feedback_submitted',    // admin: a volunteer or organizer sent feedback
    ],
    required: true,
  },
  title: { type: String, required: true, maxlength: 150 },
  message: { type: String, default: '', maxlength: 500 },
  // The activity this is about (lets the bell open the right activity). Null when not about one.
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
  readAt: { type: Date, default: null },
  // Old notifications clean themselves up after 60 days.
  createdAt: { type: Date, default: Date.now, expires: 60 * 24 * 60 * 60 },
});

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
