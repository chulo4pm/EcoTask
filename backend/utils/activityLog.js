// Records a line in an activity's history. Never throws: logging must not break the action.
const ActivityEvent = require('../models/ActivityEvent');

const logActivityEvent = async ({ activity, type, message, actor = null }) => {
  try {
    if (!activity) return;
    await ActivityEvent.create({ activity, type, message: String(message).slice(0, 300), actor });
  } catch (err) {
    console.error('Could not record activity history:', err.message);
  }
};

module.exports = { logActivityEvent };
