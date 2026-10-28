// Admin-only tools: organizer approvals, organizer account management, and activity oversight.
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Participation = require('../models/Participation');
const { notifyUsers } = require('../utils/notify');
const { logActivityEvent } = require('../utils/activityLog');
const { getActivityPhase } = require('../utils/activityTime');
const Report = require('../models/Report');
const ActivityEvent = require('../models/ActivityEvent');
const { DOCUMENT_DIR } = require('../middleware/documentUpload');
const { BUCKETS, findFile, openDownloadStream, deleteFile } = require('../utils/fileStore');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const { verificationInfo } = require('../utils/cleanupUnverified');

const toOrganizerSummary = (user, activityCount = 0) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  organizationName: user.organizationName,
  organizerStatus: user.organizerStatus,
  rejectionReason: user.rejectionReason,
  reviewedAt: user.reviewedAt,
  isSuspended: !!user.isSuspended,
  suspendedReason: user.suspendedReason || '',
  suspendedAt: user.suspendedAt || null,
  ...verificationInfo(user),
  createdAt: user.createdAt,
  activityCount,
  documents: (user.organizerDocuments || []).map((doc) => ({
    _id: doc._id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
  })),
});

// GET /api/admin/organizers?status=pending
exports.getOrganizers = async (req, res) => {
  try {
    const status = String(req.query.status || '');
    const filter = { role: 'organizer' };
    if (['pending', 'approved', 'rejected'].includes(status)) filter.organizerStatus = status;
    if (status === 'active') Object.assign(filter, { organizerStatus: 'approved', isSuspended: { $ne: true } });
    if (status === 'suspended') filter.isSuspended = true;

    const organizers = await User.find(filter).select('-password').sort({ createdAt: -1 });
    const counts = await Activity.aggregate([
      { $match: { organizer: { $in: organizers.map((o) => o._id) } } },
      { $group: { _id: '$organizer', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json(organizers.map((o) => toOrganizerSummary(o, countMap.get(String(o._id)) || 0)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/organizers/:id/documents/:docId - streams a private document to the admin.
exports.getOrganizerDocument = async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.docId)) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const organizer = await User.findOne({ _id: req.params.id, role: 'organizer' }).select('organizerDocuments');
    const doc = organizer?.organizerDocuments.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // path.basename blocks path tricks like "../../.env"
    const fileName = path.basename(doc.fileName);
    const filePath = path.join(DOCUMENT_DIR, fileName);
    const onDisk = fs.existsSync(filePath); // older uploads were saved on disk
    const stored = onDisk ? null : await findFile(BUCKETS.organizerDocuments, fileName);
    if (!onDisk && !stored) return res.status(404).json({ message: 'File is missing on the server' });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    if (onDisk) return fs.createReadStream(filePath).pipe(res);
    openDownloadStream(BUCKETS.organizerDocuments, stored._id)
      .on('error', () => res.end())
      .pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/organizers/:id/approve
exports.approveOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({ _id: req.params.id, role: 'organizer' });
    if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
    if (organizer.isEmailVerified === false) {
      return res.status(400).json({
        message: "This organizer hasn't verified their email yet. You can approve them once they confirm it.",
      });
    }

    organizer.organizerStatus = 'approved';
    organizer.rejectionReason = '';
    organizer.reviewedBy = req.user._id;
    organizer.reviewedAt = new Date();
    await organizer.save();
    notifyUsers([organizer._id], {
      type: 'organizer_approved',
      title: 'Application approved',
      message: 'Your organizer application was approved. You can now create activities.',
    });

    res.json({ message: `${organizer.organizationName || organizer.name} approved.`, organizer: toOrganizerSummary(organizer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/organizers/:id/reject  body: { reason }
exports.rejectOrganizer = async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5 || reason.length > 500) {
      return res.status(400).json({
        message: 'Please give a reason (5-500 characters). The organizer will see it.',
        errors: { reason: 'Reason required.' },
      });
    }

    const organizer = await User.findOne({ _id: req.params.id, role: 'organizer' });
    if (!organizer) return res.status(404).json({ message: 'Organizer not found' });

    organizer.organizerStatus = 'rejected';
    organizer.rejectionReason = reason;
    organizer.reviewedBy = req.user._id;
    organizer.reviewedAt = new Date();
    await organizer.save();
    notifyUsers([organizer._id], {
      type: 'organizer_rejected',
      title: 'Application rejected',
      message: `Your organizer application was rejected. Reason: ${reason}`,
    });

    res.json({ message: `${organizer.organizationName || organizer.name} rejected.`, organizer: toOrganizerSummary(organizer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/activities/:id/visibility  body: { hidden: true|false, reason }
exports.setActivityVisibility = async (req, res) => {
  try {
    const hidden = req.body.hidden === true || req.body.hidden === 'true';
    const reason = String(req.body.reason || '').trim().slice(0, 500);
    if (hidden && reason.length < 5) {
      return res.status(400).json({ message: 'Please give a reason for hiding the activity.' });
    }

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      hidden
        ? { isHidden: true, hiddenReason: reason, hiddenAt: new Date() }
        : { isHidden: false, hiddenReason: '', hiddenAt: null },
      { new: true }
    ).populate('organizer', 'name organizationName');

    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // Unhiding puts the reports that led to the hide back to Open so the admin can review again.
    if (!hidden) {
      await Report.updateMany(
        { activity: activity._id, status: 'actioned' },
        { status: 'open', resolvedBy: null, resolvedAt: null, replyToReporter: '' }
      );
    }

    logActivityEvent({
      activity: activity._id,
      type: hidden ? 'hidden' : 'unhidden',
      message: hidden ? `Hidden by admin: ${reason}` : 'Made visible again by admin',
      actor: req.user._id,
    });
    // Tell the organizer (they also see the reason on the activity card).
    if (activity.organizer) {
      notifyUsers([activity.organizer._id || activity.organizer], hidden
        ? { type: 'activity_hidden', title: 'Activity hidden by admin', message: `${activity.title} is hidden from volunteers. Reason: ${reason}`, activity: activity._id }
        : { type: 'activity_unhidden', title: 'Activity visible again', message: `${activity.title} is visible to volunteers again.`, activity: activity._id });
    }

    res.json({ message: hidden ? 'Activity hidden.' : 'Activity visible again.', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/activities/:id   body: { reason }
// Removes an upcoming or ongoing activity (with its sign-ups, reports and history).
// Every volunteer who joined, and the organizer who posted it, gets a notification with
// the admin's reason. Completed activities are kept so volunteers keep their records.
const MIN_DELETE_REASON = 10;
const MAX_DELETE_REASON = 300;

exports.deleteActivityAsAdmin = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Activity not found' });

    const reason = String(req.body?.reason || '').trim();
    if (reason.length < MIN_DELETE_REASON) {
      return res.status(400).json({ message: `Please give a reason (at least ${MIN_DELETE_REASON} characters). Everyone affected will see it.` });
    }
    if (reason.length > MAX_DELETE_REASON) {
      return res.status(400).json({ message: `The reason is too long (maximum ${MAX_DELETE_REASON} characters).` });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    if (getActivityPhase(activity) === 'completed') {
      return res.status(400).json({
        message: "Completed activities can't be deleted, so volunteers keep their participation records.",
      });
    }

    // Everyone who joined: the participants list plus any participation records.
    const participations = await Participation.find({ activity: activity._id }).select('user');
    const volunteerIds = [...new Set([
      ...(activity.participants || []),
      ...participations.map((p) => p.user),
    ].filter(Boolean).map((id) => String(id)))];

    // Keep the title short so the reason always fits inside a notification (500 characters).
    const shortTitle = activity.title.length > 80 ? `${activity.title.slice(0, 77)}...` : activity.title;

    await Promise.all([
      notifyUsers(volunteerIds, {
        type: 'activity_cancelled',
        title: 'Activity removed by admin',
        message: `"${shortTitle}" that you joined was deleted by the admin. Reason: ${reason}`,
      }),
      activity.organizer && notifyUsers([activity.organizer], {
        type: 'activity_deleted',
        title: 'Your activity was deleted by the admin',
        message: `"${shortTitle}" was removed. ${volunteerIds.length} joined volunteer${volunteerIds.length === 1 ? ' was' : 's were'} notified. Reason: ${reason}`,
      }),
    ]);

    await Promise.all([
      Participation.deleteMany({ activity: activity._id }),
      Report.deleteMany({ activity: activity._id }),
      ActivityEvent.deleteMany({ activity: activity._id }),
    ]);
    if (activity.coverImage && activity.coverImage.startsWith('/uploads/')) {
      await deleteFile(BUCKETS.activityImages, path.basename(activity.coverImage)).catch(() => {});
      await fs.promises.unlink(path.join(__dirname, '..', activity.coverImage)).catch(() => {});
    }
    await Activity.deleteOne({ _id: activity._id });

    res.json({
      message: `"${shortTitle}" was deleted. ${volunteerIds.length} volunteer${volunteerIds.length === 1 ? '' : 's'}${activity.organizer ? ' and the organizer were' : ' were'} notified.`,
      notifiedVolunteers: volunteerIds.length,
      notifiedOrganizer: Boolean(activity.organizer),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/activities/:id/organizer  body: { organizerId }
// Assigns an older (admin-created) activity to an approved organizer.
exports.assignActivityOrganizer = async (req, res) => {
  try {
    const organizerId = String(req.body.organizerId || '');
    if (!isValidId(organizerId)) return res.status(400).json({ message: 'Choose an organizer.' });

    const organizer = await User.findOne({ _id: organizerId, role: 'organizer', organizerStatus: 'approved', isSuspended: { $ne: true } });
    if (!organizer) return res.status(400).json({ message: 'Organizer must be an approved, active organizer account.' });

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { organizer: organizer._id },
      { new: true }
    ).populate('organizer', 'name organizationName');

    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    logActivityEvent({
      activity: activity._id,
      type: 'assigned',
      message: `Assigned to ${organizer.organizationName || organizer.name}`,
      actor: req.user._id,
    });
    res.json({ message: `Assigned to ${organizer.organizationName || organizer.name}.`, activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ------------------------------------------
   ORGANIZER ACCOUNT MANAGEMENT
   ------------------------------------------ */

// ---------- Volunteer accounts (User Management → Volunteers tab) ----------

const findVolunteer = async (id, res) => {
  if (!isValidId(id)) {
    res.status(404).json({ message: 'Volunteer not found' });
    return null;
  }
  const volunteer = await User.findOne({ _id: id, role: 'volunteer' });
  if (!volunteer) res.status(404).json({ message: 'Volunteer not found' });
  return volunteer;
};

const toVolunteerSummary = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  status: user.isSuspended ? 'Suspended' : 'Active',
  isSuspended: !!user.isSuspended,
  suspendedReason: user.suspendedReason || '',
  suspendedAt: user.suspendedAt || null,
});

// PATCH /api/admin/volunteers/:id/suspend  body: { reason }
// The volunteer can't log in or use EcoTask until reactivated. Their records are kept.
exports.suspendVolunteer = async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5 || reason.length > 500) {
      return res.status(400).json({
        message: 'Please give a reason (5-500 characters). The volunteer will see it.',
        errors: { reason: 'Reason required.' },
      });
    }

    const volunteer = await findVolunteer(req.params.id, res);
    if (!volunteer) return;
    if (volunteer.isSuspended) return res.status(400).json({ message: 'This volunteer is already suspended.' });

    Object.assign(volunteer, {
      isSuspended: true,
      suspendedReason: reason,
      suspendedAt: new Date(),
      suspendedBy: req.user._id,
    });
    await volunteer.save();

    res.json({ message: `${volunteer.name} suspended.`, volunteer: toVolunteerSummary(volunteer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/volunteers/:id/reactivate
exports.reactivateVolunteer = async (req, res) => {
  try {
    const volunteer = await findVolunteer(req.params.id, res);
    if (!volunteer) return;
    if (!volunteer.isSuspended) return res.status(400).json({ message: 'This volunteer is not suspended.' });

    Object.assign(volunteer, { isSuspended: false, suspendedReason: '', suspendedAt: null, suspendedBy: null });
    await volunteer.save();

    res.json({ message: `${volunteer.name} reactivated.`, volunteer: toVolunteerSummary(volunteer) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const findOrganizer = async (id, res) => {
  if (!isValidId(id)) {
    res.status(404).json({ message: 'Organizer not found' });
    return null;
  }
  const organizer = await User.findOne({ _id: id, role: 'organizer' });
  if (!organizer) res.status(404).json({ message: 'Organizer not found' });
  return organizer;
};

// GET /api/admin/organizers/:id - full profile, activities and totals
exports.getOrganizerDetails = async (req, res) => {
  try {
    const organizer = await findOrganizer(req.params.id, res);
    if (!organizer) return;

    const activities = await Activity.find({ organizer: organizer._id })
      .select('title date location volunteerLimit participants isHidden hiddenReason hiddenBySuspension')
      .sort({ date: -1 });

    const activityIds = activities.map((a) => a._id);
    const [attended, certificates] = await Promise.all([
      Participation.countDocuments({ activity: { $in: activityIds }, attendance: 'present' }),
      Participation.countDocuments({ activity: { $in: activityIds }, certificateIssued: true }),
    ]);

    res.json({
      ...toOrganizerSummary(organizer, activities.length),
      activities: activities.map((a) => ({
        _id: a._id,
        title: a.title,
        date: a.date,
        location: a.location,
        volunteerLimit: a.volunteerLimit,
        participantCount: a.participants?.length || 0,
        isHidden: a.isHidden,
        hiddenReason: a.hiddenReason,
        hiddenBySuspension: a.hiddenBySuspension,
      })),
      totals: {
        activities: activities.length,
        volunteersJoined: activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0),
        volunteersAttended: attended,
        certificatesIssued: certificates,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/organizers/:id/suspend  body: { reason }
// Blocks login + API access and hides all of the organizer's activities from volunteers.
exports.suspendOrganizer = async (req, res) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5 || reason.length > 500) {
      return res.status(400).json({
        message: 'Please give a reason (5-500 characters). The organizer will see it.',
        errors: { reason: 'Reason required.' },
      });
    }

    const organizer = await findOrganizer(req.params.id, res);
    if (!organizer) return;
    if (organizer.organizerStatus !== 'approved') {
      return res.status(400).json({ message: 'Only approved organizers can be suspended. Use Organizer Approvals for pending or rejected accounts.' });
    }
    if (organizer.isSuspended) return res.status(400).json({ message: 'This organizer is already suspended.' });

    Object.assign(organizer, {
      isSuspended: true,
      suspendedReason: reason,
      suspendedAt: new Date(),
      suspendedBy: req.user._id,
    });
    await organizer.save();

    const result = await Activity.updateMany({ organizer: organizer._id }, { hiddenBySuspension: true });

    res.json({
      message: `${organizer.organizationName || organizer.name} suspended. ${result.modifiedCount} activit${result.modifiedCount === 1 ? 'y' : 'ies'} hidden from volunteers.`,
      organizer: toOrganizerSummary(organizer),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/organizers/:id/reactivate
exports.reactivateOrganizer = async (req, res) => {
  try {
    const organizer = await findOrganizer(req.params.id, res);
    if (!organizer) return;
    if (!organizer.isSuspended) return res.status(400).json({ message: 'This organizer is not suspended.' });

    Object.assign(organizer, { isSuspended: false, suspendedReason: '', suspendedAt: null, suspendedBy: null });
    await organizer.save();

    // Only undo the suspension-hiding. Activities hidden because of reports stay hidden.
    await Activity.updateMany({ organizer: organizer._id }, { hiddenBySuspension: false });

    res.json({
      message: `${organizer.organizationName || organizer.name} reactivated.`,
      organizer: toOrganizerSummary(organizer),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/organizers/:id   body: { reason }
// Deletes the account, its private documents and every activity it posted (with the
// sign-ups, reports and history of those activities). Each volunteer who had joined
// one of those activities is notified with the admin's reason.
exports.deleteOrganizer = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 5) {
      return res.status(400).json({ message: 'Please give a reason (at least 5 characters). Volunteers will see it.' });
    }

    const organizer = await findOrganizer(req.params.id, res);
    if (!organizer) return;

    const label = organizer.organizationName || organizer.name;
    // A notification holds 500 characters, so a very long reason is shortened there.
    const shortReason = reason.length > 250 ? `${reason.slice(0, 247)}...` : reason;
    const activities = await Activity.find({ organizer: organizer._id });

    for (const activity of activities) {
      const participations = await Participation.find({ activity: activity._id }).select('user');
      const volunteerIds = [
        ...(activity.participants || []),
        ...participations.map((p) => p.user),
      ];
      await notifyUsers(volunteerIds, {
        type: 'activity_cancelled',
        title: 'Activity removed',
        message: `"${activity.title}" was removed because the organizer account (${label}) was deleted by the admin. Reason: ${shortReason}`,
      });
      await Promise.all([
        Participation.deleteMany({ activity: activity._id }),
        Report.deleteMany({ activity: activity._id }),
        ActivityEvent.deleteMany({ activity: activity._id }),
      ]);
      if (activity.coverImage && activity.coverImage.startsWith('/uploads/')) {
        await deleteFile(BUCKETS.activityImages, path.basename(activity.coverImage)).catch(() => {});
        await fs.promises.unlink(path.join(__dirname, '..', activity.coverImage)).catch(() => {});
      }
      await Activity.deleteOne({ _id: activity._id });
    }

    // Remove the private verification files (database and any older disk copies)
    await Promise.all((organizer.organizerDocuments || []).map((doc) => Promise.all([
      deleteFile(BUCKETS.organizerDocuments, path.basename(doc.fileName)).catch(() => {}),
      fs.promises.unlink(path.join(DOCUMENT_DIR, path.basename(doc.fileName))).catch(() => {}),
    ])));

    await User.deleteOne({ _id: organizer._id });

    const count = activities.length;
    res.json({
      message: count > 0
        ? `${label} deleted. ${count} activit${count === 1 ? 'y was' : 'ies were'} removed and the joined volunteers were notified.`
        : `${label} deleted.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET /api/admin/activities/:id/details
// Everything the admin's details panel shows: the activity, sign-ups, attendance,
// reports and a history built from the activity's records plus the change log.
exports.getActivityDetails = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Activity not found' });
    const activity = await Activity.findById(req.params.id)
      .populate('organizer', 'name organizationName email isSuspended');
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const [participations, reports, events] = await Promise.all([
      Participation.find({ activity: activity._id }).populate('user', 'name').sort({ joinedAt: 1 }),
      Report.find({ activity: activity._id }).populate('reporter', 'name').sort({ createdAt: -1 }),
      ActivityEvent.find({ activity: activity._id }).sort({ createdAt: -1 }).limit(100),
    ]);

    const attendance = participations.reduce((acc, p) => {
      if (p.attendance === 'present') acc.present += 1;
      else if (p.attendance === 'absent') acc.absent += 1;
      else acc.unmarked += 1;
      return acc;
    }, { total: participations.length, present: 0, absent: 0, unmarked: 0 });

    const orgName = activity.organizer ? (activity.organizer.organizationName || activity.organizer.name) : 'the admin';
    const history = [
      { at: activity.createdAt, kind: 'created', text: `Created by ${orgName}` },
      ...participations.map((p) => ({ at: p.joinedAt || p.createdAt, kind: 'joined', text: `${p.user?.name || 'A volunteer'} joined` })),
      ...reports.map((r) => ({ at: r.createdAt, kind: 'report', text: `Reported: ${r.reason}` })),
      ...reports.filter((r) => r.status === 'dismissed' && r.resolvedAt)
        .map((r) => ({ at: r.resolvedAt, kind: 'report-dismissed', text: `Report dismissed (${r.reason})` })),
      ...events.map((e) => ({ at: e.createdAt, kind: e.type, text: e.message })),
    ];
    // Hidden / finalized before the change log existed: use the dates saved on the activity.
    if (activity.isHidden && activity.hiddenAt && !events.some((e) => e.type === 'hidden')) {
      history.push({ at: activity.hiddenAt, kind: 'hidden', text: `Hidden by admin${activity.hiddenReason ? `: ${activity.hiddenReason}` : ''}` });
    }
    if (activity.attendanceFinalizedAt && !events.some((e) => e.type === 'finalized')) {
      history.push({ at: activity.attendanceFinalizedAt, kind: 'finalized', text: `Attendance finalized · ${attendance.present} present, ${attendance.absent} absent` });
    }
    history.sort((a, b) => new Date(b.at) - new Date(a.at));

    res.json({
      activity: {
        _id: activity._id,
        title: activity.title,
        description: activity.description,
        location: activity.location,
        meetingPlace: activity.meetingPlace,
        date: activity.date,
        time: activity.time,
        endTime: activity.endTime,
        volunteerLimit: activity.volunteerLimit,
        participantCount: participations.length,
        coverImage: activity.coverImage,
        isHidden: !!activity.isHidden,
        hiddenReason: activity.hiddenReason || '',
        hiddenBySuspension: !!activity.hiddenBySuspension,
        attendanceFinalized: !!activity.attendanceFinalized,
        organizer: activity.organizer,
      },
      attendance,
      reports: reports.map((r) => ({
        _id: r._id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        adminNote: r.adminNote,
        reporter: r.reporter?.name || 'Deleted user',
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
      history: history.slice(0, 40),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
