const express = require('express');
const {
  createCollaboration, listCollaborations, getCollaboration, closeCollaboration, deleteCollaboration,
  applyToCollaboration, respondToApplicant, bookmarkCollaboration, unbookmarkCollaboration, listTypes,
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/types', listTypes);
router.get('/', listCollaborations);
router.post('/', protect, createCollaboration);
router.get('/:id', getCollaboration);
router.patch('/:id/close', protect, closeCollaboration);
router.delete('/:id', protect, deleteCollaboration);
router.post('/:id/apply', protect, applyToCollaboration);
router.patch('/:id/applicants/:userId', protect, respondToApplicant);
router.post('/:id/bookmark', protect, bookmarkCollaboration);
router.delete('/:id/bookmark', protect, unbookmarkCollaboration);

module.exports = router;
