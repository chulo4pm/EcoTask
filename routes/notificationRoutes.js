// Routes for the notification bell. Every logged-in role can use them.
const express = require('express');
const { getMyNotifications, markAllRead, markRead, clearAll, deleteOne } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/', clearAll);
router.delete('/:id', deleteOne);

module.exports = router;
