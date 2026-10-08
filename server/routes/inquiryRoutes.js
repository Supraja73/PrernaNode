const express = require('express');
const {
  listInquiries, getInquiry, replyToInquiry, acceptInquiry, rejectInquiry, reserveInquiry, cancelInquiry,
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', listInquiries);
router.get('/:id', getInquiry);
router.post('/:id/reply', replyToInquiry);
router.patch('/:id/accept', acceptInquiry);
router.patch('/:id/reject', rejectInquiry);
router.patch('/:id/reserve', reserveInquiry);
router.patch('/:id/cancel', cancelInquiry);

module.exports = router;
