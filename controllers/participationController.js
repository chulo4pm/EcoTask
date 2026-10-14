// Handles volunteer participation records, attendance tracking, and certificates.
// Organizers can only manage records for activities they own.
const Participation = require('../models/Participation');
const Activity = require('../models/Activity');
const { notifyUsers } = require('../utils/notify');
const { logActivityEvent } = require('../utils/activityLog');

// Checks that the logged-in organizer owns the activity. Admins may view (read-only).
const canManageActivity = (user, activity) => (
  user.role === 'organizer' && String(activity.organizer) === String(user._id)
);

// Return the logged-in user's joined activities in a simple activity history format.
exports.getMyRecords = async (req, res) => {
  try {
    const records = await Participation.find({ user: req.user._id })
      .populate('activity', 'title date location time attendanceFinalized')
      .sort({ joinedAt: -1 });

    res.json(records.map((record) => ({
      _id: record._id,
      activityId: record.activity?._id,
      activityTitle: record.activity?.title,
      date: record.activity?.date,
      location: record.activity?.location,
      time: record.activity?.time,
      // Attendance stays hidden ("Pending") until the organizer finalizes it.
      finalized: Boolean(record.activity?.attendanceFinalized),
      attendance: record.activity?.attendanceFinalized ? record.attendance : null,
      certificateIssued: record.certificateIssued,
      certificateIssuedAt: record.certificateIssuedAt,
      certificateId: record.certificateId,
      joinedAt: record.joinedAt,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gives a certificate to every present volunteer who doesn't have one yet. Returns how many were new.
const issueCertificatesFor = async (activityId) => {
  const eligibleRecords = await Participation.find({
    activity: activityId,
    attendance: 'present',
    certificateIssued: { $ne: true },
  });
  const issuedAt = new Date();
  await Promise.all(eligibleRecords.map((record) => {
    record.certificateIssued = true;
    record.certificateIssuedAt = issuedAt;
    record.certificateId = `CERT-${record._id.toString().slice(-8).toUpperCase()}`;
    return record.save();
  }));
  return eligibleRecords;
};

// Finalize attendance (owner organizer only): everyone still unmarked becomes absent, the
// attendance becomes visible to volunteers, and present volunteers get their certificates.
// Safe to run again after editing marks - only newly present volunteers get a new certificate.
exports.finalizeActivityAttendance = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId).select('title date organizer attendanceFinalized');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (!canManageActivity(req.user, activity)) {
      return res.status(403).json({ message: 'You can only finalize attendance for your own activities' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(activity.date) >= new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
      return res.status(400).json({ message: "This activity hasn't happened yet. Finalize attendance on or after the day." });
    }

    const wasFinalized = activity.attendanceFinalized;
    const unmarked = await Participation.updateMany(
      { activity: activity._id, attendance: null },
      { $set: { attendance: 'absent' } }
    );

    const newlyIssued = await issueCertificatesFor(activity._id);
    const [presentCount, absentCount] = await Promise.all([
      Participation.countDocuments({ activity: activity._id, attendance: 'present' }),
      Participation.countDocuments({ activity: activity._id, attendance: 'absent' }),
    ]);

    activity.attendanceFinalized = true;
    activity.attendanceFinalizedAt = new Date();
    await activity.save();
    logActivityEvent({
      activity: activity._id,
      type: 'finalized',
      message: `${wasFinalized ? 'Attendance updated' : 'Attendance finalized'} · ${presentCount} present, ${absentCount} absent`,
      actor: req.user._id,
    });

    // Tell volunteers: everyone the first time, afterwards only those who just got a certificate.
    const everyone = await Participation.find({ activity: activity._id }).select('user attendance');
    if (!wasFinalized) {
      notifyUsers(everyone.map((r) => r.user), {
        type: 'attendance_marked',
        title: 'Attendance finalized',
        message: `Your attendance for ${activity.title} is now final. Check your participation record.`,
        activity: activity._id,
      });
    } else if (newlyIssued.length > 0) {
      notifyUsers(newlyIssued.map((r) => r.user), {
        type: 'attendance_marked',
        title: 'Certificate issued',
        message: `Your certificate for ${activity.title} is ready.`,
        activity: activity._id,
      });
    }

    res.json({
      message: `Attendance finalized. ${newlyIssued.length} new certificate(s) issued.`,
      presentCount,
      absentCount,
      markedAbsent: unmarked.modifiedCount ?? unmarked.nModified ?? 0,
      issuedCount: newlyIssued.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return participation records for an activity.
// Volunteers see only their own record; organizers only for their own activities; admins read-only.
exports.getActivityParticipation = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId).select('organizer');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const query = { activity: req.params.activityId };
    if (req.user.role === 'volunteer') query.user = req.user._id;
    if (req.user.role === 'organizer' && !canManageActivity(req.user, activity)) {
      return res.status(403).json({ message: 'You can only view records for your own activities' });
    }

    const records = await Participation.find(query)
      .populate('activity', 'title date')
      .populate('user', 'name email phone')
      .sort({ joinedAt: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark attendance as present or absent (owner organizer only).
exports.updateAttendance = async (req, res) => {
  try {
    const attendance = String(req.body.attendance || '');
    if (!['present', 'absent'].includes(attendance)) {
      return res.status(400).json({ message: 'Invalid attendance value' });
    }

    const record = await Participation.findById(req.params.id).populate('activity', 'title date organizer attendanceFinalized');
    if (!record) return res.status(404).json({ message: 'Participation record not found' });
    if (!record.activity || !canManageActivity(req.user, record.activity)) {
      return res.status(403).json({ message: 'You can only update attendance for your own activities' });
    }

    record.attendance = attendance;
    await record.save();
    // While attendance is a draft volunteers see "Pending", so only notify after it is finalized.
    if (record.activity.attendanceFinalized) {
      notifyUsers([record.user], {
        type: 'attendance_marked',
        title: 'Attendance updated',
        message: `You were marked ${attendance} for ${record.activity.title}.`,
        activity: record.activity._id,
      });
    }
    await record.populate('user', 'name email phone');
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
