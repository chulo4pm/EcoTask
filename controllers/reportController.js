// Volunteers report activities; admins review them; organizers see reports on their own activities.
const mongoose = require('mongoose');
const Report = require('../models/Report');
const { REPORT_REASONS } = require('../models/Report');
const Activity = require('../models/Activity');
const { notifyUsers } = require('../utils/notify');
const { logActivityEvent } = require('../utils/activityLog');

// Reports with these reasons are shown first and marked urgent for the admin.
const URGENT_REASONS = ['Scam or suspicious activity', 'Safety concern'];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

// GET /api/reports/reasons - list of allowed reasons (for the report form).
exports.getReportReasons = (req, res) => {
  res.json(REPORT_REASONS);
};

// POST /api/reports - volunteer reports an activity.
exports.createReport = async (req, res) => {
  try {
    const activityId = String(req.body.activityId || '');
    const reason = String(req.body.reason || '');
    const details = String(req.body.details || '').trim();

    const errors = {};
    if (!isValidId(activityId)) errors.activityId = 'Invalid activity.';
    if (!REPORT_REASONS.includes(reason)) errors.reason = 'Please choose a reason.';
    if (reason === 'Other' && details.length < 10) errors.details = 'Please describe the problem (at least 10 characters).';
    if (details.length > 500) errors.details = 'Details must be 500 characters or fewer.';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const activity = await Activity.findById(activityId).select('_id isHidden');
    if (!activity || activity.isHidden) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const existing = await Report.findOne({ activity: activity._id, reporter: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You already reported this activity. The admin will review it.' });
    }

    const report = await Report.create({
      activity: activity._id,
      reporter: req.user._id,
      reason,
      details,
    });

    res.status(201).json({ message: 'Report submitted. Thank you for helping keep EcoTask safe.', reportId: report._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/mine - activity IDs the volunteer has already reported.
exports.getMyReportedActivities = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id }).select('activity');
    res.json(reports.map((report) => String(report.activity)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports?status=open - admin list of reports.
exports.getReports = async (req, res) => {
  try {
    const status = String(req.query.status || '');
    const filter = ['open', 'dismissed', 'actioned'].includes(status) ? { status } : {};

    const reports = await Report.find(filter)
      .populate({
        path: 'activity',
        select: 'title date location isHidden hiddenReason organizer participants',
        populate: { path: 'organizer', select: 'name organizationName email reviewedAt isSuspended' },
      })
      .populate('reporter', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    // Each organizer's track record: reports on their activities and activities hidden.
    const organizerIds = [...new Set(reports
      .map((r) => r.activity?.organizer?._id).filter(Boolean).map(String))];
    const records = new Map();
    if (organizerIds.length > 0) {
      const theirActivities = await Activity.find({ organizer: { $in: organizerIds } }).select('_id organizer isHidden');
      const activityOwner = new Map(theirActivities.map((a) => [String(a._id), String(a.organizer)]));
      const allReports = await Report.find({ activity: { $in: theirActivities.map((a) => a._id) } }).select('activity');
      organizerIds.forEach((id) => records.set(id, { reports: 0, activitiesReported: new Set(), hiddenActivities: 0 }));
      theirActivities.forEach((a) => { if (a.isHidden) records.get(String(a.organizer)).hiddenActivities += 1; });
      allReports.forEach((r) => {
        const owner = activityOwner.get(String(r.activity));
        if (!owner) return;
        const rec = records.get(owner);
        rec.reports += 1;
        rec.activitiesReported.add(String(r.activity));
      });
    }

    res.json(reports.map((report) => {
      const data = report.toObject();
      data.urgent = URGENT_REASONS.includes(report.reason);
      if (data.activity) {
        // Build new objects (never edit the shared populated activity).
        const { participants, ...activity } = data.activity;
        const organizerId = activity.organizer?._id && String(activity.organizer._id);
        const rec = organizerId && records.get(organizerId);
        data.activity = {
          ...activity,
          participantCount: (participants || []).length,
          ...(rec && {
            organizer: {
              ...activity.organizer,
              record: {
                reports: rec.reports,
                activitiesReported: rec.activitiesReported.size,
                hiddenActivities: rec.hiddenActivities,
              },
            },
          }),
        };
      }
      return data;
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/summary - numbers for the admin's Reports tiles.
exports.getReportSummary = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [open, urgent, openActivities, dismissedThisWeek, actionedThisWeek] = await Promise.all([
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'open', reason: { $in: URGENT_REASONS } }),
      Report.distinct('activity', { status: 'open' }),
      Report.countDocuments({ status: 'dismissed', resolvedAt: { $gte: weekAgo } }),
      Report.distinct('activity', { status: 'actioned', resolvedAt: { $gte: weekAgo } }),
    ]);
    res.json({
      open,
      urgent,
      openActivities: openActivities.length,
      dismissedThisWeek,
      hiddenThisWeek: actionedThisWeek.length,
      resolvedThisWeek: dismissedThisWeek + actionedThisWeek.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/reports/:id - admin resolves a report.
// body: { action: 'dismiss' | 'hide', note }
// 'hide' hides the activity from volunteers and closes all open reports for it.
exports.resolveReport = async (req, res) => {
  try {
    const action = String(req.body.action || '');
    const note = String(req.body.note || '').trim().slice(0, 500);

    if (!['dismiss', 'hide'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "dismiss" or "hide".' });
    }
    if (action === 'hide' && note.length < 5) {
      return res.status(400).json({ message: 'Please give a reason for hiding the activity (the organizer will see it).', errors: { note: 'Reason required.' } });
    }

    // Both default to on; the admin can untick them in the confirm card.
    const notifyReporters = req.body.notifyReporters !== false;
    const notifyOrganizer = req.body.notifyOrganizer !== false;

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'open') return res.status(400).json({ message: 'This report was already resolved.' });

    const activity = await Activity.findById(report.activity).select('title organizer');
    const title = activity?.title || 'the activity';
    const resolvedFields = { resolvedBy: req.user._id, resolvedAt: new Date(), adminNote: note };

    if (action === 'dismiss') {
      Object.assign(report, { status: 'dismissed', ...resolvedFields });
      await report.save();
      if (notifyReporters) {
        notifyUsers([report.reporter], {
          type: 'report_reviewed',
          title: 'Report reviewed',
          message: `Thanks for your report on ${title}. The admin reviewed it and decided no action was needed.`,
          activity: report.activity,
        });
      }
      return res.json({ message: 'Report dismissed.' });
    }

    const openReports = await Report.find({ activity: report.activity, status: 'open' }).select('reporter');
    await Activity.updateOne(
      { _id: report.activity },
      { isHidden: true, hiddenReason: note, hiddenAt: new Date() }
    );
    const result = await Report.updateMany(
      { activity: report.activity, status: 'open' },
      { status: 'actioned', ...resolvedFields }
    );
    logActivityEvent({ activity: report.activity, type: 'hidden', message: `Hidden after reports: ${note}`, actor: req.user._id });

    if (notifyReporters) {
      notifyUsers(openReports.map((r) => r.reporter), {
        type: 'report_reviewed',
        title: 'Report reviewed',
        message: `Thanks for your report on ${title}. The admin reviewed it and hid the activity.`,
        activity: report.activity,
      });
    }
    if (notifyOrganizer && activity?.organizer) {
      notifyUsers([activity.organizer], {
        type: 'activity_hidden',
        title: 'Activity hidden by admin',
        message: `${title} is hidden from volunteers. Reason: ${note}`,
        activity: report.activity,
      });
    }

    res.json({ message: `Activity hidden. ${result.modifiedCount} report(s) closed.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reports/organizer - reports about the logged-in organizer's activities.
// Reporter identity is NOT shared with organizers.
exports.getOrganizerReports = async (req, res) => {
  try {
    const activities = await Activity.find({ organizer: req.user._id }).select('_id');
    const reports = await Report.find({ activity: { $in: activities.map((a) => a._id) } })
      .populate('activity', 'title date isHidden hiddenReason')
      .select('-reporter')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
