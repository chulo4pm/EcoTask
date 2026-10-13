// Dashboard controller for summary metrics across activities, volunteers, organizers, and participation.
const Activity = require('../models/Activity');
const Participation = require('../models/Participation');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Report = require('../models/Report');

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Build admin metrics such as activity count, volunteer totals, and registration trends.
exports.getAdminStats = async (req, res) => {
  try {
    const [activitiesCreated, totalVolunteers, monthlyRegistrations, certificatesIssued, pendingOrganizers, openReports, approvedOrganizers] = await Promise.all([
      Activity.countDocuments(),
      User.countDocuments({ role: 'volunteer' }),
      User.aggregate([
        { $match: { role: 'volunteer' } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
      Participation.countDocuments({ certificateIssued: true }),
      User.countDocuments({ role: 'organizer', organizerStatus: 'pending' }),
      Report.countDocuments({ status: 'open' }),
      User.countDocuments({ role: 'organizer', organizerStatus: 'approved' }),
    ]);

    res.json({
      activitiesCreated,
      totalVolunteers,
      certificatesIssued,
      pendingOrganizers,
      openReports,
      approvedOrganizers,
      monthlyRegistrations: monthlyRegistrations.map((item) => ({
        month: monthNames[item._id - 1],
        count: item.count,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Build the current volunteer's personal dashboard summary from their records.
exports.getVolunteerStats = async (req, res) => {
  try {
    const records = await Participation.find({ user: req.user._id }).populate('activity', 'attendanceFinalized');
    res.json({
      activitiesJoined: records.length,
      // Only count attendance the organizer has finalized (until then volunteers see "Pending").
      completedActivities: records.filter((record) => record.activity?.attendanceFinalized && record.attendance === 'present').length,
      totalHours: 0,
      certificatesEarned: records.filter((record) => record.certificateIssued).length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Summary for the logged-in organizer (their own activities only): totals, things that need
// the organizer's attention, and a short feed of recent events.
exports.getOrganizerStats = async (req, res) => {
  try {
    const activities = await Activity.find({ organizer: req.user._id })
      .select('_id date participants isHidden title attendanceFinalized');
    const activityIds = activities.map((a) => a._id);
    const titleById = new Map(activities.map((a) => [String(a._id), a.title]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [records, openReportList, recentJoins, recentReports] = await Promise.all([
      Participation.find({ activity: { $in: activityIds } }).select('activity attendance certificateIssued certificateIssuedAt joinedAt'),
      Report.find({ activity: { $in: activityIds }, status: 'open' }).select('activity createdAt'),
      Participation.find({ activity: { $in: activityIds } }).sort({ joinedAt: -1 }).limit(6).populate('user', 'name').select('activity user joinedAt'),
      Report.find({ activity: { $in: activityIds } }).sort({ createdAt: -1 }).limit(4).select('activity createdAt'),
    ]);

    const byActivity = new Map();
    records.forEach((record) => {
      const key = String(record.activity);
      if (!byActivity.has(key)) byActivity.set(key, []);
      byActivity.get(key).push(record);
    });

    // Attendance rate only counts activities whose attendance has been finalized.
    const finalizedIds = new Set(activities.filter((a) => a.attendanceFinalized).map((a) => String(a._id)));
    let presentFinal = 0;
    let decidedFinal = 0;
    records.forEach((record) => {
      if (!finalizedIds.has(String(record.activity))) return;
      if (record.attendance === 'present') { presentFinal += 1; decidedFinal += 1; }
      if (record.attendance === 'absent') decidedFinal += 1;
    });

    // "Needs your attention": finalize attendance, issue certificates, open reports.
    const needsAttention = [];
    activities.forEach((activity) => {
      const list = byActivity.get(String(activity._id)) || [];
      if (list.length === 0 || new Date(activity.date) >= endOfToday) return;
      if (!activity.attendanceFinalized) {
        needsAttention.push({
          type: 'finalize',
          activityId: activity._id,
          title: activity.title,
          date: activity.date,
          unmarked: list.filter((r) => !r.attendance).length,
          total: list.length,
        });
      } else {
        const waiting = list.filter((r) => r.attendance === 'present' && !r.certificateIssued).length;
        if (waiting > 0) {
          needsAttention.push({ type: 'certificates', activityId: activity._id, title: activity.title, date: activity.date, count: waiting });
        }
      }
    });
    const reportsByActivity = new Map();
    openReportList.forEach((report) => {
      const key = String(report.activity);
      reportsByActivity.set(key, (reportsByActivity.get(key) || 0) + 1);
    });
    reportsByActivity.forEach((count, key) => {
      needsAttention.push({ type: 'report', activityId: key, title: titleById.get(key) || 'Activity', count });
    });

    // Recent events: volunteers joining, certificates issued (per activity and day), new reports.
    const feed = [];
    recentJoins.forEach((record) => feed.push({
      type: 'join', at: record.joinedAt, name: record.user?.name || 'A volunteer', title: titleById.get(String(record.activity)),
    }));
    const certGroups = new Map();
    records.filter((r) => r.certificateIssued && r.certificateIssuedAt).forEach((record) => {
      const key = `${record.activity}-${new Date(record.certificateIssuedAt).toDateString()}`;
      const group = certGroups.get(key) || { type: 'certificates', at: record.certificateIssuedAt, count: 0, title: titleById.get(String(record.activity)) };
      group.count += 1;
      certGroups.set(key, group);
    });
    certGroups.forEach((group) => feed.push(group));
    recentReports.forEach((report) => feed.push({ type: 'report', at: report.createdAt, title: titleById.get(String(report.activity)) }));
    feed.sort((x, y) => new Date(y.at) - new Date(x.at));

    res.json({
      totalActivities: activities.length,
      upcomingActivities: activities.filter((a) => new Date(a.date) >= today).length,
      totalVolunteersJoined: activities.reduce((sum, a) => sum + (a.participants?.length || 0), 0),
      volunteersAttended: records.filter((r) => r.attendance === 'present').length,
      joinedThisWeek: records.filter((r) => r.joinedAt && new Date(r.joinedAt) >= weekAgo).length,
      attendanceRate: decidedFinal > 0 ? Math.round((presentFinal / decidedFinal) * 100) : null,
      attendedFinal: presentFinal,
      decidedFinal,
      certificatesIssued: records.filter((r) => r.certificateIssued).length,
      openReports: openReportList.length,
      hiddenActivities: activities.filter((a) => a.isHidden).length,
      needsAttention,
      recentActivity: feed.slice(0, 6),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return the latest real admin-facing events for the dashboard activity feed.
exports.getAdminActivityFeed = async (req, res) => {
  try {
    const [activities, registrations, announcements, organizers, reports] = await Promise.all([
      Activity.find().sort({ createdAt: -1 }).limit(50).select('title createdAt').populate('organizer', 'organizationName name'),
      Participation.find()
        .sort({ joinedAt: -1 })
        .limit(50)
        .populate('user', 'name')
        .populate('activity', 'title'),
      Announcement.find().sort({ createdAt: -1 }).limit(50).select('title createdAt'),
      User.find({ role: 'organizer' }).sort({ createdAt: -1 }).limit(20).select('name organizationName createdAt'),
      Report.find().sort({ createdAt: -1 }).limit(20).populate('activity', 'title').select('reason createdAt activity'),
    ]);

    const feed = [
      ...activities.map((activity) => ({
        id: `activity-${activity._id}`,
        title: 'New Activity Published',
        description: `${activity.title} was published${activity.organizer ? ` by ${activity.organizer.organizationName || activity.organizer.name}` : ''}.`,
        timestamp: activity.createdAt,
        type: 'activity',
      })),
      ...registrations
        .filter((record) => record.user && record.activity)
        .map((record) => ({
          id: `registration-${record._id}`,
          title: 'New Volunteer Joined',
          description: `${record.user.name} joined ${record.activity.title}.`,
          timestamp: record.joinedAt,
          type: 'registration',
        })),
      ...announcements.map((announcement) => ({
        id: `announcement-${announcement._id}`,
        title: 'Announcement Posted',
        description: `${announcement.title} was posted.`,
        timestamp: announcement.createdAt,
        type: 'announcement',
      })),
      ...organizers.map((organizer) => ({
        id: `organizer-${organizer._id}`,
        title: 'Organizer Signed Up',
        description: `${organizer.organizationName || organizer.name} applied as an organizer.`,
        timestamp: organizer.createdAt,
        type: 'registration',
      })),
      ...reports
        .filter((report) => report.activity)
        .map((report) => ({
          id: `report-${report._id}`,
          title: 'Activity Reported',
          description: `${report.activity.title}: ${report.reason}.`,
          timestamp: report.createdAt,
          type: 'report',
        })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);

    res.json(feed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rank volunteers by how many activities they actually attended (marked present).
exports.getTopVolunteers = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    const results = await Participation.aggregate([
      {
        $group: {
          _id: '$user',
          attended: {
            $sum: { $cond: [{ $eq: ['$attendance', 'present'] }, 1, 0] },
          },
          joined: { $sum: 1 },
        },
      },
      { $match: { attended: { $gt: 0 } } },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'volunteer' } },
      { $sort: { attended: -1, joined: -1, 'user.name': 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          attended: 1,
          joined: 1,
        },
      },
    ]);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
