const asyncHandler = require('express-async-handler');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Collaboration = require('../models/Collaboration');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');

// @desc    Search across Part 4 resources — communities, events, opportunities,
//          collaborations, and (privately) the user's own chats. Kept as a new,
//          separate endpoint rather than editing Part 2's /api/search, per the
//          "don't modify completed features unless integration requires it" rule.
// @route   GET /api/advanced-search?q=&type=all|communities|events|opportunities|collaborations|chats
// @access  Public (chats require auth; omitted from results if not logged in)
const advancedSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const type = req.query.type || 'all';
  const limit = Math.min(parseInt(req.query.limit) || 8, 20);

  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const results = {};

  if (type === 'all' || type === 'communities') {
    results.communities = await Community.find({ isActive: true, $text: { $search: q } }).limit(limit).select('name category description logo memberCount');
  }
  if (type === 'all' || type === 'events') {
    results.events = await Event.find({ $text: { $search: q } }).limit(limit).select('title date mode banner status');
  }
  if (type === 'all' || type === 'opportunities') {
    results.opportunities = await Opportunity.find({ isActive: true, $text: { $search: q } }).limit(limit).select('title type organization deadline');
  }
  if (type === 'all' || type === 'collaborations') {
    results.collaborations = await Collaboration.find({ status: 'open', $text: { $search: q } }).limit(limit).select('title type rolesNeeded');
  }
  if ((type === 'all' || type === 'chats') && req.user) {
    const myChats = await Chat.find({ participants: req.user._id }).select('_id');
    results.messages = await ChatMessage.find({
      chat: { $in: myChats.map((c) => c._id) },
      $text: { $search: q },
      deletedForEveryone: false,
    })
      .limit(limit)
      .populate('sender', 'name username avatar')
      .populate('chat', 'name isGroup');
  }

  res.json({ success: true, data: results });
});

module.exports = { advancedSearch };
