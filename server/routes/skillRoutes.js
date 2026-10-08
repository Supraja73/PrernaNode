const express = require('express');
const {
  createSkill, updateSkill, deleteSkill, getSkill, discoverSkills, listCategories, listMentorSkills,
} = require('../controllers/skillController');
const { protect, optionalAuth } = require('../middleware/auth');
const { skillUpload } = require('../middleware/part3Upload');
const { skillRules } = require('../validators/part3Validators');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/mentor/:userId', listMentorSkills);
router.get('/', discoverSkills);
router.post('/', protect, skillUpload, skillRules, createSkill);
router.get('/:id', optionalAuth, getSkill);
router.patch('/:id', protect, skillUpload, updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
