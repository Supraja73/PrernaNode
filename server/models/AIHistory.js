const mongoose = require('mongoose');

const AI_FEATURES = [
  'resume_suggestions', 'career_roadmap', 'interview_prep', 'skill_recommendations',
  'learning_recommendations', 'profile_improvement', 'portfolio_review',
  'community_recommendations', 'business_growth', 'entrepreneurship_tips',
  'networking_suggestions', 'job_prep', 'hackathon_suggestions', 'scholarship_suggestions',
  'daily_productivity_tip', 'story_improvement', 'story_title', 'story_grammar',
  'story_hashtags', 'story_summary', 'story_key_learnings', 'story_motivational_ending',
];

// Every AI interaction is logged here — real request/response pairs, used both as a
// user-facing history and as an audit trail for the (rate-limited) AI endpoints.
const aiHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: AI_FEATURES, required: true },
    input: { type: mongoose.Schema.Types.Mixed }, // whatever context was sent (story text, prompt, etc.)
    output: { type: String, required: true },
    model: { type: String, default: '' },
  },
  { timestamps: true }
);

aiHistorySchema.index({ user: 1, feature: 1, createdAt: -1 });

module.exports = mongoose.model('AIHistory', aiHistorySchema);
module.exports.FEATURES = AI_FEATURES;
