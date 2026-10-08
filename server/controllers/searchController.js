const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Story = require('../models/Story');
const Hashtag = require('../models/Hashtag');
const { attachViewerFlags } = require('./storyController');

// @desc    Global search across users, stories, and hashtags
// @route   GET /api/search?q=&type=all|users|stories|hashtags|skills
// @access  Public
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const type = req.query.type || 'all';
  const limit = Math.min(parseInt(req.query.limit) || 8, 20);

  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const results = {};

  if (type === 'all' || type === 'users' || type === 'skills') {
    const userFilter =
      type === 'skills'
        ? { skills: { $regex: q, $options: 'i' } }
        : { $text: { $search: q } };
    results.users = await User.find(userFilter)
      .select('name username avatar headline skills role')
      .limit(limit);
  }

  if (type === 'all' || type === 'stories') {
    const stories = await Story.find({ status: 'published', $text: { $search: q } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('author', 'name username avatar headline');
    results.stories = await attachViewerFlags(stories, req.user?._id);
  }

  if (type === 'all' || type === 'hashtags') {
    results.hashtags = await Hashtag.find({ tag: { $regex: `^${q.replace(/[^a-z0-9_]/gi, '')}`, $options: 'i' } })
      .sort({ usageCount: -1 })
      .limit(limit);
  }

  res.json({ success: true, data: results });
});

module.exports = { globalSearch };
