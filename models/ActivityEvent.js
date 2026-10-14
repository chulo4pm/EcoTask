// One line in an activity's history (shown to the admin in Activity Oversight).
// Joins, reports and the creation date come from their own records; this keeps the rest.
const mongoose = require('mongoose');

const activityEventSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
  type: {
    type: String,
    enum: ['edited', 'hidden', 'unhidden', 'assigned', 'left', 'finalized'],
    required: true,
  },
  message: { type: String, required: true, maxlength: 300 },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
});

activityEventSchema.index({ activity: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityEvent', activityEventSchema);
