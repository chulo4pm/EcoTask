// Controller for creating, listing, and managing announcements shown to users.
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const { notifyVolunteers, notifyOrganizers } = require('../utils/notify');

const populateAuthor = (query) => query.populate('author', 'name');

// The category is the audience: who can see the announcement.
//   Volunteer -> volunteers only, Organizer -> organizers only, General -> both.
const CATEGORIES = ['Volunteer', 'Organizer', 'General'];
// Older posts used other names.
const LEGACY = { 'organizer updates': 'Organizer', important: 'General', volunteers: 'Volunteer', organizers: 'Organizer' };
const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'General';
  return CATEGORIES.find((c) => c.toLowerCase() === raw) || LEGACY[raw] || null;
};
// Which categories each role may see (including the old names, until migrated).
const VISIBLE_TO = {
  volunteer: ['Volunteer', 'General', 'Important'],
  organizer: ['Organizer', 'General', 'Organizer Updates', 'Important'],
};

// Rename old categories in the database (safe to run every start).
exports.migrateAnnouncementCategories = async () => {
  try {
    await Announcement.updateMany({ category: 'Organizer Updates' }, { category: 'Organizer' });
    await Announcement.updateMany({ category: { $in: ['Important', null, ''] } }, { category: 'General' });
  } catch (err) {
    console.error('Could not update announcement categories:', err.message);
  }
};

const withCategory = (announcement) => {
  const data = announcement.toObject ? announcement.toObject() : { ...announcement };
  data.category = normalizeCategory(data.category) || 'General';
  return data;
};
const LIMITS = { titleMin: 3, titleMax: 100, messageMin: 5, messageMax: 2000 };

// Reads ONLY title, category, and message from the request (nothing else can be set),
// and checks them. Returns { data, errors }.
const readAnnouncement = (body) => {
  const title = String(body.title ?? '').trim().replace(/\s+/g, ' ');
  const message = String(body.description ?? body.message ?? '').trim();
  const category = normalizeCategory(body.category);

  const errors = {};
  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    errors.title = `Title must be ${LIMITS.titleMin}-${LIMITS.titleMax} characters.`;
  }
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) {
    errors.description = `Message must be ${LIMITS.messageMin}-${LIMITS.messageMax} characters.`;
  }
  if (!category) {
    errors.category = `Choose who can see this: ${CATEGORIES.join(', ')}.`;
  }

  return { data: { title, category, description: message, message }, errors };
};

const sendErrors = (res, errors) => {
  const keys = Object.keys(errors);
  if (keys.length === 0) return false;
  res.status(400).json({ message: errors[keys[0]], errors });
  return true;
};

// Fetch the latest announcements with the author's name included.
exports.getAnnouncements = async (req, res) => {
  try {
    // Admins see everything; volunteers and organizers only what's meant for them.
    const filter = VISIBLE_TO[req.user.role] ? { category: { $in: VISIBLE_TO[req.user.role] } } : {};
    const announcements = await populateAuthor(
      Announcement.find(filter).sort({ createdAt: -1 })
    );
    res.json(announcements.map(withCategory));
  } catch (error) {
    res.status(500).json({ message: 'Could not load announcements.' });
  }
};

// Create a new announcement from admin input and attach the author.
exports.createAnnouncement = async (req, res) => {
  try {
    const { data, errors } = readAnnouncement(req.body);
    if (sendErrors(res, errors)) return;

    const announcement = await Announcement.create({ ...data, author: req.user._id });
    await announcement.populate('author', 'name');
    const payload = {
      type: 'announcement',
      title: announcement.title,
      message: announcement.description || announcement.message,
    };
    if (data.category !== 'Organizer') notifyVolunteers(payload);
    if (data.category !== 'Volunteer') notifyOrganizers(payload);
    res.status(201).json(withCategory(announcement));
  } catch (error) {
    res.status(500).json({ message: 'Could not post the announcement.' });
  }
};

// Update an announcement's title, category, and message. Marks it as edited.
exports.updateAnnouncement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const { data, errors } = readAnnouncement(req.body);
    if (sendErrors(res, errors)) return;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    const changed = data.title !== announcement.title
      || data.category !== normalizeCategory(announcement.category)
      || data.description !== (announcement.description || announcement.message);
    if (!changed) {
      return res.status(400).json({ message: 'No changes to save.' });
    }

    Object.assign(announcement, data, { editedAt: new Date() });
    await announcement.save();
    await announcement.populate('author', 'name');
    res.json(withCategory(announcement));
  } catch (error) {
    res.status(500).json({ message: 'Could not save the announcement.' });
  }
};

// Remove an announcement if it exists and return a success message.
exports.deleteAnnouncement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete the announcement.' });
  }
};
