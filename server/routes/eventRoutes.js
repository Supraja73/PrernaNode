const express = require('express');
const { createEvent, updateEvent, deleteEvent, getEvent, listEvents, rsvp, leaveFeedback } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { eventUpload } = require('../middleware/communityUpload');

const router = express.Router();

router.get('/', listEvents);
router.post('/', protect, eventUpload, createEvent);
router.get('/:id', getEvent);
router.patch('/:id', protect, eventUpload, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/rsvp', protect, rsvp);
router.post('/:id/feedback', protect, leaveFeedback);

module.exports = router;
