// Admin-only routes: organizer approvals, organizer accounts, and activity oversight.
const express = require('express');
const {
  getOrganizers,
  getOrganizerDocument,
  approveOrganizer,
  rejectOrganizer,
  setActivityVisibility,
  assignActivityOrganizer,
  deleteActivityAsAdmin,
  getOrganizerDetails,
  suspendOrganizer,
  reactivateOrganizer,
  deleteOrganizer,
  suspendVolunteer,
  reactivateVolunteer,
  getActivityDetails,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/organizers', getOrganizers);
router.get('/organizers/:id/documents/:docId', getOrganizerDocument);
router.patch('/organizers/:id/approve', approveOrganizer);
router.patch('/organizers/:id/reject', rejectOrganizer);

// Organizer account management (User Management → Organizers tab)
router.get('/organizers/:id', getOrganizerDetails);
router.patch('/organizers/:id/suspend', suspendOrganizer);
router.patch('/organizers/:id/reactivate', reactivateOrganizer);
router.delete('/organizers/:id', deleteOrganizer);

// Volunteer account management (User Management → Volunteers tab)
router.patch('/volunteers/:id/suspend', suspendVolunteer);
router.patch('/volunteers/:id/reactivate', reactivateVolunteer);

router.get('/activities/:id/details', getActivityDetails);
router.patch('/activities/:id/visibility', setActivityVisibility);
router.patch('/activities/:id/organizer', assignActivityOrganizer);
// Delete an upcoming/ongoing activity with a reason; volunteers and the organizer are notified.
router.delete('/activities/:id', deleteActivityAsAdmin);

module.exports = router;
