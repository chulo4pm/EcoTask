// One-time migration for the "finalize attendance" change. Run it once on your existing database:
//   npm run migrate-attendance
// 1. Volunteers once marked "late" become "present" (the late option was removed).
// 2. Past activities where every volunteer was already marked are set to "finalized", so
//    volunteers don't see them as "Pending" forever.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Participation = require('../models/Participation');
const Activity = require('../models/Activity');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const late = await Participation.collection.updateMany({ attendance: 'late' }, { $set: { attendance: 'present' } });
  console.log(`late -> present: ${late.modifiedCount} record(s)`);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const activities = await Activity.find({ date: { $lt: startOfToday }, attendanceFinalized: { $ne: true } }).select('_id');
  let finalized = 0;
  for (const activity of activities) {
    const unmarked = await Participation.countDocuments({ activity: activity._id, attendance: null });
    const total = await Participation.countDocuments({ activity: activity._id });
    if (total > 0 && unmarked === 0) {
      await Activity.updateOne({ _id: activity._id }, { $set: { attendanceFinalized: true, attendanceFinalizedAt: new Date() } });
      finalized += 1;
    }
  }
  console.log(`activities marked finalized: ${finalized}`);

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
