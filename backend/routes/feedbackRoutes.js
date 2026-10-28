// Routes for user feedback. Sending is for volunteers and organizers; reading is admin only.
const express = require('express');
const { createFeedback, getFeedback, markFeedbackRead, deleteFeedback } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const volunteerOrOrganizer = (req, res, next) => (
  ['volunteer', 'organizer'].includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'Only volunteers and organizers can send feedback.' })
);

router.post('/', protect, volunteerOrOrganizer, createFeedback);
router.get('/admin', protect, adminOnly, getFeedback);
router.patch('/admin/:id/read', protect, adminOnly, markFeedbackRead);
router.delete('/admin/:id', protect, adminOnly, deleteFeedback);

module.exports = router;
