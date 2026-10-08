const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Business = require('../models/Business');
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

// @desc    Create a marketplace listing
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const body = req.body;
  const tags = typeof body.tags === 'string' ? body.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

  if (body.businessId) {
    const business = await Business.findById(body.businessId);
    if (!business || String(business.owner) !== String(req.user._id)) {
      res.status(403);
      throw new Error('You can only list products under your own business');
    }
  }

  const product = await Product.create({
    seller: req.user._id,
    business: body.businessId || null,
    name: body.name,
    description: body.description,
    category: body.category,
    tags,
    images: filesFromReq(req, 'images'),
    video: singleFileFromReq(req, 'video'),
    stock: body.stock ?? 1,
    availability: body.availability || 'in-stock',
    shippingInfo: body.shippingInfo || '',
    condition: body.condition || 'new',
  });

  res.status(201).json({ success: true, data: product });
});

// @desc    Update a listing (seller only)
// @route   PATCH /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (String(product.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own listings');
  }

  const body = req.body;
  const editable = ['name', 'description', 'category', 'stock', 'availability', 'shippingInfo', 'condition'];
  editable.forEach((f) => {
    if (body[f] !== undefined) product[f] = body[f];
  });
  if (body.tags !== undefined) {
    product.tags = typeof body.tags === 'string' ? body.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : body.tags;
  }
  if (req.files?.images?.length) {
    await Promise.all(product.images.map((i) => cloudinary.uploader.destroy(i.publicId).catch(() => {})));
    product.images = filesFromReq(req, 'images');
  }
  if (req.files?.video?.[0]) {
    if (product.video?.publicId) await cloudinary.uploader.destroy(product.video.publicId, { resource_type: 'video' }).catch(() => {});
    product.video = singleFileFromReq(req, 'video');
  }

  await product.save();
  res.json({ success: true, data: product });
});

// @desc    Hide / unhide a listing
// @route   PATCH /api/products/:id/hide
// @access  Private
const toggleHide = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (String(product.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only manage your own listings');
  }
  product.status = product.status === 'hidden' ? 'active' : 'hidden';
  await product.save();
  res.json({ success: true, data: { status: product.status } });
});

// @desc    Mark sold / available again
// @route   PATCH /api/products/:id/sold
// @access  Private
const toggleSold = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (String(product.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only manage your own listings');
  }
  product.status = product.status === 'sold' ? 'active' : 'sold';
  await product.save();
  res.json({ success: true, data: { status: product.status } });
});

// @desc    Delete a listing
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (String(product.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own listings');
  }

  await Promise.all(product.images.map((i) => cloudinary.uploader.destroy(i.publicId).catch(() => {})));
  if (product.video?.publicId) await cloudinary.uploader.destroy(product.video.publicId, { resource_type: 'video' }).catch(() => {});
  await product.deleteOne();

  res.json({ success: true, message: 'Listing deleted' });
});

// @desc    Get a product (increments view count)
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('seller', 'name username avatar')
    .populate('business', 'businessName logo');
  if (!product || product.status === 'hidden') {
    res.status(404);
    throw new Error('Product not found');
  }
  if (!req.user || String(product.seller._id) !== String(req.user._id)) {
    product.viewCount += 1;
    await product.save();
  }
  res.json({ success: true, data: product });
});

// @desc    Browse marketplace — filter + search + paginate
// @route   GET /api/products?category=&q=&minPrice=&featured=&page=&limit=
// @access  Public
const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { status: 'active' };
  if (q.category) filter.category = q.category;
  if (q.condition) filter.condition = q.condition;
  if (q.featured === 'true') filter.featured = true;
  if (q.q) filter.$text = { $search: q.q };

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ featured: -1, createdAt: -1 }).skip(skip).limit(limit).populate('seller', 'name username avatar'),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    Report a listing
// @route   POST /api/products/:id/report
// @access  Private
const reportProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { reportsCount: 1 } }, { new: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Listing reported. Our team will review it.' });
});

const shareProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } }, { new: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.json({ success: true, data: { sharesCount: product.sharesCount, url: `${clientUrl}/marketplace/${product._id}` } });
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: Product.CATEGORIES });
});

const listBySeller = asyncHandler(async (req, res) => {
  const filter = { seller: req.params.userId, status: { $ne: 'hidden' } };
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

module.exports = {
  createProduct,
  updateProduct,
  toggleHide,
  toggleSold,
  deleteProduct,
  getProduct,
  listProducts,
  reportProduct,
  shareProduct,
  listCategories,
  listBySeller,
};
