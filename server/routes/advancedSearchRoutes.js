const express = require('express');
const { advancedSearch } = require('../controllers/advancedSearchController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
router.get('/', optionalAuth, advancedSearch);

module.exports = router;
