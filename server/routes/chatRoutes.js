const express = require('express');
const {
  listChats, startDirectChat, createGroupChat, getMessages, postMessage, searchMessages,
  togglePinMessage, toggleStarMessage, listPinned, listStarred,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { chatAttachmentUpload } = require('../middleware/communityUpload');

const router = express.Router();
router.use(protect);

router.get('/', listChats);
router.post('/direct/:userId', startDirectChat);
router.post('/group', createGroupChat);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', chatAttachmentUpload, postMessage);
router.get('/:id/messages/search', searchMessages);
router.get('/:id/messages/pinned', listPinned);
router.get('/:id/messages/starred', listStarred);
router.patch('/messages/:id/pin', togglePinMessage);
router.patch('/messages/:id/star', toggleStarMessage);

module.exports = router;
