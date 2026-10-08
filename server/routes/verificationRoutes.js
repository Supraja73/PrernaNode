const express = require('express');
const { requestVerification, myVerificationStatus } = require('../controllers/verificationController');
const { protect } = require('../middleware/auth');
const { verificationDocUpload } = require('../middleware/verificationUpload');

const router = express.Router();
router.use(protect);

router.post('/', verificationDocUpload, requestVerification);
router.get('/mine', myVerificationStatus);

module.exports = router;
