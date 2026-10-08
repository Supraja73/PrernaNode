const Hashtag = require('../models/Hashtag');

// Increments usage counts for a set of tags, creating any that don't exist yet.
const registerHashtags = async (tags = []) => {
  if (!tags.length) return;
  const ops = tags.map((tag) => ({
    updateOne: {
      filter: { tag: tag.toLowerCase() },
      update: { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
      upsert: true,
    },
  }));
  await Hashtag.bulkWrite(ops);
};

// Decrements usage counts (used when a story is deleted/unpublished).
const unregisterHashtags = async (tags = []) => {
  if (!tags.length) return;
  const ops = tags.map((tag) => ({
    updateOne: {
      filter: { tag: tag.toLowerCase() },
      update: { $inc: { usageCount: -1 } },
    },
  }));
  await Hashtag.bulkWrite(ops);
};

module.exports = { registerHashtags, unregisterHashtags };
