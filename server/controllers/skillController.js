const asyncHandler = require('express-async-handler');
const Skill = require('../models/Skill');
const cloudinary = require('../config/cloudinary');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const filesFromReq = (req, field) => (req.files?.[field] || []).map((f) => ({ url: f.path, publicId: f.filename }));
const singleFileFromReq = (req, field) => {
  const f = req.files?.[field]?.[0];
  return f ? { url: f.path, publicId: f.filename } : undefined;
};

// @desc    Become a mentor / list a skill
// @route   POST /api/skills
// @access  Private
const createSkill = asyncHandler(async (req, res) => {
  const body = req.body;
  const languagesSpoken = typeof body.languagesSpoken === 'string' ? body.languagesSpoken.split(',').map((s) => s.trim()).filter(Boolean) : body.languagesSpoken || [];
  const achievements = typeof body.achievements === 'string' ? body.achievements.split(',').map((s) => s.trim()).filter(Boolean) : body.achievements || [];
  const availability = body.availability ? JSON.parse(body.availability) : [];

  const skill = await Skill.create({
    mentor: req.user._id,
    skillName: body.skillName,
    category: body.category,
    experienceLevel: body.experienceLevel,
    yearsOfExperience: body.yearsOfExperience,
    languagesSpoken,
    teachingMode: body.teachingMode,
    city: body.city,
    state: body.state,
    country: body.country,
    timezone: body.timezone,
    availability,
    sessionDurationMinutes: body.sessionDurationMinutes || 30,
    priceLabel: body.priceLabel === 'Paid' ? 'Paid' : 'Free',
    bio: body.bio,
    portfolio: singleFileFromReq(req, 'portfolio'),
    resume: singleFileFromReq(req, 'resume'),
    certificates: filesFromReq(req, 'certificates'),
    demoImages: filesFromReq(req, 'demoImages'),
    demoVideo: singleFileFromReq(req, 'demoVideo'),
    socialLinks: {
      github: body.github || '',
      linkedin: body.linkedin || '',
      portfolioWebsite: body.portfolioWebsite || '',
    },
    achievements,
  });

  res.status(201).json({ success: true, data: skill });
});

// @desc    Update a skill listing (mentor only)
// @route   PATCH /api/skills/:id
// @access  Private
const updateSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error('Skill listing not found');
  }
  if (String(skill.mentor) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own skill listings');
  }

  const body = req.body;
  const editable = [
    'skillName', 'category', 'experienceLevel', 'yearsOfExperience', 'teachingMode',
    'city', 'state', 'country', 'timezone', 'sessionDurationMinutes', 'priceLabel', 'bio',
  ];
  editable.forEach((f) => {
    if (body[f] !== undefined) skill[f] = body[f];
  });
  if (body.languagesSpoken !== undefined) {
    skill.languagesSpoken = typeof body.languagesSpoken === 'string' ? body.languagesSpoken.split(',').map((s) => s.trim()).filter(Boolean) : body.languagesSpoken;
  }
  if (body.achievements !== undefined) {
    skill.achievements = typeof body.achievements === 'string' ? body.achievements.split(',').map((s) => s.trim()).filter(Boolean) : body.achievements;
  }
  if (body.availability !== undefined) {
    skill.availability = typeof body.availability === 'string' ? JSON.parse(body.availability) : body.availability;
  }
  if (body.github !== undefined || body.linkedin !== undefined || body.portfolioWebsite !== undefined) {
    skill.socialLinks = {
      github: body.github ?? skill.socialLinks.github,
      linkedin: body.linkedin ?? skill.socialLinks.linkedin,
      portfolioWebsite: body.portfolioWebsite ?? skill.socialLinks.portfolioWebsite,
    };
  }

  if (req.files?.certificates?.length) {
    await Promise.all(skill.certificates.map((c) => cloudinary.uploader.destroy(c.publicId).catch(() => {})));
    skill.certificates = filesFromReq(req, 'certificates');
  }
  if (req.files?.demoImages?.length) {
    await Promise.all(skill.demoImages.map((c) => cloudinary.uploader.destroy(c.publicId).catch(() => {})));
    skill.demoImages = filesFromReq(req, 'demoImages');
  }
  if (req.files?.resume?.[0]) {
    if (skill.resume?.publicId) await cloudinary.uploader.destroy(skill.resume.publicId, { resource_type: 'raw' }).catch(() => {});
    skill.resume = singleFileFromReq(req, 'resume');
  }
  if (req.files?.portfolio?.[0]) {
    if (skill.portfolio?.publicId) await cloudinary.uploader.destroy(skill.portfolio.publicId, { resource_type: 'raw' }).catch(() => {});
    skill.portfolio = singleFileFromReq(req, 'portfolio');
  }
  if (req.files?.demoVideo?.[0]) {
    if (skill.demoVideo?.publicId) await cloudinary.uploader.destroy(skill.demoVideo.publicId, { resource_type: 'video' }).catch(() => {});
    skill.demoVideo = singleFileFromReq(req, 'demoVideo');
  }

  await skill.save();
  res.json({ success: true, data: skill });
});

// @desc    Deactivate/delete a skill listing
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error('Skill listing not found');
  }
  if (String(skill.mentor) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own skill listings');
  }

  const allAssets = [
    ...skill.certificates,
    ...skill.demoImages,
    ...(skill.resume?.publicId ? [{ publicId: skill.resume.publicId, resource_type: 'raw' }] : []),
    ...(skill.portfolio?.publicId ? [{ publicId: skill.portfolio.publicId, resource_type: 'raw' }] : []),
  ];
  await Promise.all(allAssets.map((a) => cloudinary.uploader.destroy(a.publicId, { resource_type: a.resource_type || 'image' }).catch(() => {})));
  if (skill.demoVideo?.publicId) {
    await cloudinary.uploader.destroy(skill.demoVideo.publicId, { resource_type: 'video' }).catch(() => {});
  }

  await skill.deleteOne();
  res.json({ success: true, message: 'Skill listing deleted' });
});

// @desc    Get a single skill/mentor profile (increments profile views)
// @route   GET /api/skills/:id
// @access  Public
const getSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id).populate('mentor', 'name username avatar headline location');
  if (!skill) {
    res.status(404);
    throw new Error('Skill listing not found');
  }
  if (!req.user || String(skill.mentor._id) !== String(req.user._id)) {
    skill.profileViews += 1;
    await skill.save();
  }
  res.json({ success: true, data: skill });
});

// @desc    Discover mentors/skills — filter + sort + paginate
// @route   GET /api/skills?skillName=&category=&experienceLevel=&minRating=&language=&teachingMode=&city=&sort=&page=&limit=
// @access  Public
const discoverSkills = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { isActive: true };

  if (q.skillName) filter.$text = { $search: q.skillName };
  if (q.category) filter.category = q.category;
  if (q.experienceLevel) filter.experienceLevel = q.experienceLevel;
  if (q.minRating) filter.averageRating = { $gte: Number(q.minRating) };
  if (q.language) filter.languagesSpoken = { $regex: q.language, $options: 'i' };
  if (q.teachingMode) filter.teachingMode = q.teachingMode;
  if (q.city) filter.city = { $regex: q.city, $options: 'i' };
  if (q.country) filter.country = { $regex: q.country, $options: 'i' };

  const sortMap = {
    'highest-rated': { averageRating: -1, reviewsCount: -1 },
    'most-popular': { totalStudents: -1, profileViews: -1 },
    'recently-joined': { createdAt: -1 },
    alphabetical: { skillName: 1 },
  };
  const sort = sortMap[q.sort] || sortMap['recently-joined'];

  const [skills, total] = await Promise.all([
    Skill.find(filter).sort(sort).skip(skip).limit(limit).populate('mentor', 'name username avatar headline'),
    Skill.countDocuments(filter),
  ]);

  res.json({ success: true, data: skills, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Skill.CATEGORIES });
});

// @desc    Skills listed by a specific mentor
// @route   GET /api/skills/mentor/:userId
// @access  Public
const listMentorSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ mentor: req.params.userId, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: skills });
});

module.exports = {
  createSkill,
  updateSkill,
  deleteSkill,
  getSkill,
  discoverSkills,
  listCategories,
  listMentorSkills,
};
