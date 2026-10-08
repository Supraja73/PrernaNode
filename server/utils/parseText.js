// Extracts #hashtags and @mentions from free text (story descriptions, comments).
// Kept dependency-free and simple — good enough for tags/mentions, not a full markdown parser.

const HASHTAG_RE = /#([a-zA-Z0-9_]{2,50})/g;
const MENTION_RE = /@([a-z0-9_]{3,30})/gi;

const extractHashtags = (text = '') => {
  const matches = [...text.matchAll(HASHTAG_RE)].map((m) => m[1].toLowerCase());
  return [...new Set(matches)];
};

const extractMentionHandles = (text = '') => {
  const matches = [...text.matchAll(MENTION_RE)].map((m) => m[1].toLowerCase());
  return [...new Set(matches)];
};

module.exports = { extractHashtags, extractMentionHandles };
