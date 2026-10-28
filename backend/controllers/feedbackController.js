// Feedback from volunteers and organizers, read by the admin.
const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const { notifyAdmins } = require('../utils/notify');

const CATEGORIES = ['suggestion', 'bug', 'compliment', 'other'];
const MAX_PER_HOUR = 5;
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/feedback   body: { category, rating, message }  (volunteer or organizer)
exports.createFeedback = async (req, res) => {
  try {
    const category = String(req.body?.category || '');
    const rating = Number(req.body?.rating);
    const message = String(req.body?.message || '').trim();

    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Please choose what your feedback is about.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Please choose a star rating from 1 to 5.' });
    if (message.length < 10) return res.status(400).json({ message: 'Please write at least 10 characters.' });
    if (message.length > 1000) return res.status(400).json({ message: 'Your message is too long (1000 characters max).' });

    const recent = await Feedback.countDocuments({
      user: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (recent >= MAX_PER_HOUR) {
      return res.status(429).json({ message: 'You have sent a lot of feedback. Please try again later.' });
    }

    const feedback = await Feedback.create({ user: req.user._id, role: req.user.role, category, rating, message });

    const who = req.user.organizationName || req.user.name;
    notifyAdmins({
      type: 'feedback_submitted',
      title: 'New feedback',
      message: `${who} (${req.user.role}) sent feedback: ${message}`,
    });

    res.status(201).json({ message: 'Thank you! Your feedback was sent.', id: feedback._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/feedback  (admin) newest first
exports.getFeedback = async (req, res) => {
  try {
    const items = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('user', 'name email organizationName');
    res.json(items.map((item) => ({
      _id: item._id,
      user: item.user
        ? { name: item.user.organizationName || item.user.name, email: item.user.email }
        : null,
      role: item.role,
      category: item.category,
      rating: item.rating,
      message: item.message,
      createdAt: item.createdAt,
      readAt: item.readAt,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/feedback/:id/read
exports.markFeedbackRead = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Feedback not found' });
    const item = await Feedback.findByIdAndUpdate(req.params.id, { readAt: new Date() }, { new: true });
    if (!item) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/feedback/:id
exports.deleteFeedback = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Feedback not found' });
    const item = await Feedback.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
