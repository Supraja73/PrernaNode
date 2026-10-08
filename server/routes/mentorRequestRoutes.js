const express = require('express');
const {
  createRequest, listRequests, getRequest, acceptRequest, rejectRequest,
  suggestNewTime, completeRequest, cancelRequest,
} = require('../controllers/mentorRequestController');
const { protect } = require('../middleware/auth');
const { skillUpload } = require('../middleware/part3Upload'); // reused for the optional resume field
const { mentorRequestRules } = require('../validators/part3Validators');

const router = express.Router();
router.use(protect);

router.get('/', listRequests);
router.post('/', skillUpload, mentorRequestRules, createRequest);
router.get('/:id', getRequest);
router.patch('/:id/accept', acceptRequest);
router.patch('/:id/reject', rejectRequest);
router.patch('/:id/suggest-time', suggestNewTime);
router.patch('/:id/complete', completeRequest);
router.patch('/:id/cancel', cancelRequest);

module.exports = router;
