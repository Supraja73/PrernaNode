const asyncHandler = require('express-async-handler');
const Bookmark = require('../models/Bookmark');

// @desc    List the logged-in user's bookmarks (optionally filtered by type)
// @route   GET /api/bookmarks?type=
// @access  Private
const listBookmarks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.resourceType = req.query.type;

  const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: bookmarks });
});

// @desc    Add a bookmark
// @route   POST /api/bookmarks
// @access  Private
const addBookmark = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    res.status(400);
    throw new Error('resourceType and resourceId are required');
  }

  const existing = await Bookmark.findOne({ user: req.user._id, resourceType, resourceId });
  if (existing) {
    res.status(409);
    throw new Error('Already bookmarked');
  }

  const bookmark = await Bookmark.create({ user: req.user._id, resourceType, resourceId });
  res.status(201).json({ success: true, data: bookmark });
});

// @desc    Remove a bookmark
// @route   DELETE /api/bookmarks/:id
// @access  Private
const removeBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findOne({ _id: req.params.id, user: req.user._id });
  if (!bookmark) {
    res.status(404);
    throw new Error('Bookmark not found');
  }
  await bookmark.deleteOne();
  res.json({ success: true, message: 'Bookmark removed' });
});

module.exports = { listBookmarks, addBookmark, removeBookmark };
