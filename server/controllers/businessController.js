const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const cloudinary = require('../config/cloudinary');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const singleFileFromReq = (req, field) => {
  const f = req.files?.[field]?.[0];
  return f ? { url: f.path, publicId: f.filename } : undefined;
};
const filesFromReq = (req, field) => (req.files?.[field] || []).map((f) => ({ url: f.path, publicId: f.filename }));

// @desc    Create a business/entrepreneur profile
// @route   POST /api/businesses
// @access  Private
const createBusiness = asyncHandler(async (req, res) => {
  const body = req.body;
  const business = await Business.create({
    owner: req.user._id,
    businessName: body.businessName,
    founderName: body.founderName || req.user.name,
    description: body.description,
    category: body.category,
    logo: singleFileFromReq(req, 'logo'),
    coverBanner: singleFileFromReq(req, 'coverBanner'),
    gallery: filesFromReq(req, 'gallery'),
    website: body.website,
    email: body.email,
    phone: body.phone,
    city: body.city,
    state: body.state,
    country: body.country,
    socialLinks: {
      instagram: body.instagram || '',
      facebook: body.facebook || '',
      twitter: body.twitter || '',
      linkedin: body.linkedin || '',
    },
  });

  res.status(201).json({ success: true, data: business.toPublicObject(req.user._id) });
});

// @desc    Update a business profile (owner only)
// @route   PATCH /api/businesses/:id
// @access  Private
const updateBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  if (String(business.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own business');
  }

  const body = req.body;
  const editable = ['businessName', 'founderName', 'description', 'category', 'website', 'email', 'phone', 'city', 'state', 'country'];
  editable.forEach((f) => {
    if (body[f] !== undefined) business[f] = body[f];
  });
  if (body.instagram !== undefined || body.facebook !== undefined || body.twitter !== undefined || body.linkedin !== undefined) {
    business.socialLinks = {
      instagram: body.instagram ?? business.socialLinks.instagram,
      facebook: body.facebook ?? business.socialLinks.facebook,
      twitter: body.twitter ?? business.socialLinks.twitter,
      linkedin: body.linkedin ?? business.socialLinks.linkedin,
    };
  }

  if (req.files?.logo?.[0]) {
    if (business.logo?.publicId) await cloudinary.uploader.destroy(business.logo.publicId).catch(() => {});
    business.logo = singleFileFromReq(req, 'logo');
  }
  if (req.files?.coverBanner?.[0]) {
    if (business.coverBanner?.publicId) await cloudinary.uploader.destroy(business.coverBanner.publicId).catch(() => {});
    business.coverBanner = singleFileFromReq(req, 'coverBanner');
  }
  if (req.files?.gallery?.length) {
    await Promise.all(business.gallery.map((g) => cloudinary.uploader.destroy(g.publicId).catch(() => {})));
    business.gallery = filesFromReq(req, 'gallery');
  }

  await business.save();
  res.json({ success: true, data: business.toPublicObject(req.user._id) });
});

// @desc    Delete a business profile
// @route   DELETE /api/businesses/:id
// @access  Private
const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  if (String(business.owner) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own business');
  }

  const assets = [business.logo, business.coverBanner, ...business.gallery].filter((a) => a?.publicId);
  await Promise.all(assets.map((a) => cloudinary.uploader.destroy(a.publicId).catch(() => {})));
  await business.deleteOne();

  res.json({ success: true, message: 'Business deleted' });
});

// @desc    Get a business profile (increments profile views)
// @route   GET /api/businesses/:id
// @access  Public
const getBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id).populate('owner', 'name username avatar');
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  if (!req.user || String(business.owner._id) !== String(req.user._id)) {
    business.profileViews += 1;
    await business.save();
  }
  res.json({ success: true, data: business.toPublicObject(req.user?._id) });
});

// @desc    Browse the business directory — filter + search + paginate
// @route   GET /api/businesses?category=&city=&country=&q=&page=&limit=
// @access  Public
const listBusinesses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { isActive: true };
  if (q.category) filter.category = q.category;
  if (q.city) filter.city = { $regex: q.city, $options: 'i' };
  if (q.country) filter.country = { $regex: q.country, $options: 'i' };
  if (q.q) filter.$text = { $search: q.q };

  const [businesses, total] = await Promise.all([
    Business.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name username avatar'),
    Business.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: businesses.map((b) => b.toPublicObject(req.user?._id)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Follow / unfollow a business
// @route   POST /api/businesses/:id/follow
// @access  Private
const followBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  const already = business.followers.some((f) => String(f) === String(req.user._id));
  if (already) {
    res.status(409);
    throw new Error('Already following this business');
  }
  business.followers.push(req.user._id);
  await business.save();

  await notify({ recipient: business.owner, actor: req.user._id, type: 'business_follow', message: `${req.user.name} followed ${business.businessName}`, refModel: 'Business', refId: business._id });

  res.json({ success: true, data: { followersCount: business.followers.length } });
});

const unfollowBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  business.followers = business.followers.filter((f) => String(f) !== String(req.user._id));
  await business.save();
  res.json({ success: true, data: { followersCount: business.followers.length } });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Business.CATEGORIES });
});

// @desc    Businesses owned by a specific user
// @route   GET /api/businesses/owner/:userId
// @access  Public
const listByOwner = asyncHandler(async (req, res) => {
  const businesses = await Business.find({ owner: req.params.userId, isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: businesses.map((b) => b.toPublicObject(req.user?._id)) });
});

module.exports = {
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusiness,
  listBusinesses,
  followBusiness,
  unfollowBusiness,
  listCategories,
  listByOwner,
};
