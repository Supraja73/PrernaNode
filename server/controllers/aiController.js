const asyncHandler = require('express-async-handler');
const rateLimit = require('express-rate-limit');
const AIHistory = require('../models/AIHistory');
const Story = require('../models/Story');
const Skill = require('../models/Skill');
const Community = require('../models/Community');
const { generateCompletion, isConfigured } = require('../services/aiService');

const SYSTEM_BASE =
  'You are the PrernaNode AI Assistant, embedded in a professional networking and growth platform for women ("Connect. Inspire. Rise."). ' +
  'Be specific, actionable, and warm — never generic filler. Base every suggestion on the real profile data provided; ' +
  'never invent facts about the user that were not given to you. Keep responses well-structured with short paragraphs or bullet points.';

// Builds the {system, userMessage} pair for each career-assistant feature from real
// profile data — no canned text, no placeholders.
const buildCareerPrompt = (feature, user, input = {}) => {
  const profile = `Name: ${user.name}\nHeadline: ${user.headline || 'Not set'}\nBio: ${user.bio || 'Not set'}\nSkills: ${(user.skills || []).join(', ') || 'None listed'}\nLocation: ${user.location || 'Not set'}\nRole: ${user.role}`;

  const prompts = {
    resume_suggestions: {
      system: SYSTEM_BASE,
      userMessage: `Review this profile and suggest concrete resume improvements (bullet points, phrasing, sections to add):\n\n${profile}\n\nAdditional context from the user: ${input.notes || 'None'}`,
    },
    career_roadmap: {
      system: SYSTEM_BASE,
      userMessage: `Based on this profile, propose a realistic 6-12 month career roadmap with milestones:\n\n${profile}\n\nStated career goal: ${input.goal || 'Not specified — infer a sensible direction from the profile'}`,
    },
    interview_prep: {
      system: SYSTEM_BASE,
      userMessage: `Generate interview preparation guidance (likely questions + how to answer them) for this profile targeting this role:\n\n${profile}\n\nTarget role: ${input.targetRole || 'Not specified — infer from skills/headline'}`,
    },
    skill_recommendations: {
      system: SYSTEM_BASE,
      userMessage: `Recommend 5 specific skills this person should learn next, with a one-line reason each:\n\n${profile}`,
    },
    learning_recommendations: {
      system: SYSTEM_BASE,
      userMessage: `Suggest a concrete learning path (courses/topics, not specific brand names unless well known) for this profile:\n\n${profile}`,
    },
    profile_improvement: {
      system: SYSTEM_BASE,
      userMessage: `What's missing or weak in this profile, and how should they improve it?\n\n${profile}`,
    },
    portfolio_review: {
      system: SYSTEM_BASE,
      userMessage: `Give portfolio review feedback based on this profile and description of their work:\n\n${profile}\n\nPortfolio description: ${input.portfolioNotes || 'Not provided'}`,
    },
    community_recommendations: {
      system: SYSTEM_BASE,
      userMessage: `Given this profile and this list of real available communities, recommend the 3 best fits with reasons:\n\n${profile}\n\nAvailable communities: ${input.communityList}`,
    },
    business_growth: {
      system: SYSTEM_BASE,
      userMessage: `Suggest business growth strategies for this entrepreneur profile:\n\n${profile}\n\nBusiness context: ${input.businessNotes || 'Not provided'}`,
    },
    entrepreneurship_tips: {
      system: SYSTEM_BASE,
      userMessage: `Give 5 practical entrepreneurship tips relevant to this profile:\n\n${profile}`,
    },
    networking_suggestions: {
      system: SYSTEM_BASE,
      userMessage: `Suggest specific networking actions this person could take this week:\n\n${profile}`,
    },
    job_prep: {
      system: SYSTEM_BASE,
      userMessage: `Help this person prepare for job applications — what to highlight, what gaps to address:\n\n${profile}\n\nTarget job: ${input.targetJob || 'Not specified'}`,
    },
    hackathon_suggestions: {
      system: SYSTEM_BASE,
      userMessage: `Suggest what kind of hackathons/competitions would suit this profile and how to prepare:\n\n${profile}`,
    },
    scholarship_suggestions: {
      system: SYSTEM_BASE,
      userMessage: `Suggest what categories of scholarships/fellowships would suit this profile and how to strengthen an application:\n\n${profile}`,
    },
    daily_productivity_tip: {
      system: SYSTEM_BASE,
      userMessage: `Give one specific, actionable productivity tip for today, tailored to this profile:\n\n${profile}`,
    },
  };

  return prompts[feature];
};

const buildStoryPrompt = (feature, story) => {
  const context = `Title: ${story.title}\nCategory: ${story.category}\nDescription:\n${story.description}`;
  const prompts = {
    story_improvement: { system: SYSTEM_BASE, userMessage: `Suggest specific improvements to this story's structure, clarity, and impact:\n\n${context}` },
    story_title: { system: SYSTEM_BASE, userMessage: `Suggest 5 improved, compelling titles for this story:\n\n${context}` },
    story_grammar: { system: SYSTEM_BASE, userMessage: `Point out grammar and readability issues in this story and how to fix them:\n\n${context}` },
    story_hashtags: { system: SYSTEM_BASE, userMessage: `Suggest 8 relevant hashtags for this story (no # symbol, comma separated):\n\n${context}` },
    story_summary: { system: SYSTEM_BASE, userMessage: `Write a 2-sentence summary of this story:\n\n${context}` },
    story_key_learnings: { system: SYSTEM_BASE, userMessage: `Extract 3-5 key learnings/takeaways from this story as bullet points:\n\n${context}` },
    story_motivational_ending: { system: SYSTEM_BASE, userMessage: `Write a short, genuine (not cheesy) motivational closing paragraph that fits this story's voice:\n\n${context}` },
  };
  return prompts[feature];
};

// @desc    Run a career-assistant AI feature (uses the logged-in user's real profile)
// @route   POST /api/ai/career/:feature
// @access  Private
const runCareerFeature = asyncHandler(async (req, res) => {
  const { feature } = req.params;

  let input = req.body || {};
  if (feature === 'community_recommendations') {
    const communities = await Community.find({ isActive: true, visibility: 'public' })
      .select('name category description')
      .limit(20);
    input = { ...input, communityList: communities.map((c) => `${c.name} (${c.category}): ${c.description?.slice(0, 100)}`).join('\n') };
  }

  const built = buildCareerPrompt(feature, req.user, input);
  if (!built) {
    res.status(400);
    throw new Error('Unknown AI feature');
  }

  const { text, model } = await generateCompletion(built.system, built.userMessage, 800);

  await AIHistory.create({ user: req.user._id, feature, input, output: text, model });
  res.json({ success: true, data: { feature, output: text } });
});

// @desc    Run a story-assistant AI feature against one of the user's own stories
// @route   POST /api/ai/story/:feature
// @access  Private
const runStoryFeature = asyncHandler(async (req, res) => {
  const { feature } = req.params;
  const { storyId } = req.body;

  const story = await Story.findById(storyId);
  if (!story) {
    res.status(404);
    throw new Error('Story not found');
  }
  if (String(story.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only run AI assistance on your own stories');
  }

  const built = buildStoryPrompt(feature, story);
  if (!built) {
    res.status(400);
    throw new Error('Unknown AI feature');
  }

  const { text, model } = await generateCompletion(built.system, built.userMessage, 600);

  await AIHistory.create({ user: req.user._id, feature, input: { storyId }, output: text, model });
  res.json({ success: true, data: { feature, output: text } });
});

// @desc    AI mentor matching — real scoring algorithm over live Skill/User data, not
//          an LLM call (this is a structured ranking problem, better suited to explicit
//          scoring than a generative model, and it's instant/free to run)
// @route   GET /api/ai/mentor-match
// @access  Private
const mentorMatch = asyncHandler(async (req, res) => {
  const user = req.user;
  const candidates = await Skill.find({ isActive: true, mentor: { $ne: user._id } })
    .populate('mentor', 'name username avatar headline location')
    .limit(200);

  const userSkillsLower = (user.skills || []).map((s) => s.toLowerCase());
  const userLangsLower = (user.languages || []).map((l) => l.toLowerCase());

  const scored = candidates.map((skill) => {
    let score = 0;
    const reasons = [];

    if (userSkillsLower.some((s) => skill.skillName.toLowerCase().includes(s) || s.includes(skill.skillName.toLowerCase()))) {
      score += 30;
      reasons.push('Matches a skill on your profile');
    }
    if (skill.languagesSpoken?.some((l) => userLangsLower.includes(l.toLowerCase()))) {
      score += 15;
      reasons.push('Shares a spoken language');
    }
    if (user.location && skill.city && user.location.toLowerCase().includes(skill.city.toLowerCase())) {
      score += 10;
      reasons.push('Located nearby');
    }
    score += Math.min(skill.averageRating * 5, 25); // up to 25 pts for a perfect 5.0 rating
    score += Math.min(skill.totalStudents, 10); // experience signal, capped
    if (skill.teachingMode === 'Online') score += 5; // most accessible by default

    return { skill, score, reasons };
  });

  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ skill, score, reasons }) => ({ skill, matchScore: Math.round(score), reasons }));

  res.json({ success: true, data: ranked });
});

// @desc    AI business recommendations — real aggregation over live data (collaborators,
//          communities, trending categories), not a generative model
// @route   GET /api/ai/business-recommendations
// @access  Private
const businessRecommendations = asyncHandler(async (req, res) => {
  const Business = require('../models/Business');
  const Product = require('../models/Product');
  const Collaboration = require('../models/Collaboration');

  const myBusinesses = await Business.find({ owner: req.user._id });
  const myCategories = myBusinesses.map((b) => b.category);

  const [potentialCollaborators, trendingCategories, openCollaborations, communitySuggestions] = await Promise.all([
    Business.find({ category: { $in: myCategories }, owner: { $ne: req.user._id }, isActive: true })
      .select('businessName category owner')
      .populate('owner', 'name username avatar')
      .limit(6),
    Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalViews: { $sum: '$viewCount' } } },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
    ]),
    Collaboration.find({ status: 'open' }).sort({ createdAt: -1 }).limit(6).populate('postedBy', 'name username avatar'),
    Community.find({ isActive: true, visibility: 'public' }).sort({ memberCount: -1 }).limit(5),
  ]);

  res.json({
    success: true,
    data: {
      potentialCollaborators,
      trendingCategories: trendingCategories.map((c) => ({ category: c._id, listings: c.count, totalViews: c.totalViews })),
      openCollaborations,
      communitySuggestions,
    },
  });
});

// @desc    AI usage history for the logged-in user
// @route   GET /api/ai/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 15, 40);
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    AIHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AIHistory.countDocuments({ user: req.user._id }),
  ]);

  res.json({ success: true, data: history, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const status = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { configured: isConfigured() } });
});

module.exports = { runCareerFeature, runStoryFeature, mentorMatch, businessRecommendations, getHistory, status };
