const asyncHandler = require('express-async-handler');
const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 15, 40);
  return { page, limit, skip: (page - 1) * limit };
};

// @desc    Contact seller / send an inquiry about a product
// @route   POST /api/products/:productId/inquiries
// @access  Private
const createInquiry = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (String(product.seller) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot inquire about your own listing');
  }

  const inquiry = await Inquiry.create({
    product: product._id,
    buyer: req.user._id,
    seller: product.seller,
    initialMessage: req.body.message,
    messages: [{ sender: req.user._id, text: req.body.message }],
  });

  await notify({
    recipient: product.seller,
    actor: req.user._id,
    type: 'product_inquiry',
    message: `${req.user.name} is interested in "${product.name}"`,
    refModel: 'Inquiry',
    refId: inquiry._id,
  });

  res.status(201).json({ success: true, data: inquiry });
});

// @desc    List inquiries (as buyer or seller)
// @route   GET /api/inquiries?role=buyer|seller&status=
// @access  Private
const listInquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const role = req.query.role === 'seller' ? 'seller' : 'buyer';
  const filter = { [role]: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name images status')
      .populate('buyer', 'name username avatar')
      .populate('seller', 'name username avatar'),
    Inquiry.countDocuments(filter),
  ]);

  res.json({ success: true, data: inquiries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

const assertParty = (inquiry, userId) => {
  const isParty = [String(inquiry.buyer), String(inquiry.seller)].includes(String(userId));
  if (!isParty) {
    const err = new Error('You are not part of this inquiry');
    err.statusCode = 403;
    throw err;
  }
};

const getInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('product', 'name images status seller')
    .populate('buyer', 'name username avatar')
    .populate('seller', 'name username avatar')
    .populate('messages.sender', 'name username avatar');
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  assertParty(inquiry, req.user._id);
  res.json({ success: true, data: inquiry });
});

// @desc    Reply within an inquiry thread (either party)
// @route   POST /api/inquiries/:id/reply
// @access  Private
const replyToInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  assertParty(inquiry, req.user._id);

  inquiry.messages.push({ sender: req.user._id, text: req.body.text });
  await inquiry.save();

  const recipient = String(inquiry.buyer) === String(req.user._id) ? inquiry.seller : inquiry.buyer;
  await notify({ recipient, actor: req.user._id, type: 'inquiry_reply', message: `${req.user.name} replied to your inquiry`, refModel: 'Inquiry', refId: inquiry._id });

  res.json({ success: true, data: inquiry });
});

// @desc    Seller accepts an inquiry
// @route   PATCH /api/inquiries/:id/accept
// @access  Private
const acceptInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  if (String(inquiry.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the seller can accept an inquiry');
  }
  inquiry.status = 'accepted';
  await inquiry.save();
  await notify({ recipient: inquiry.buyer, actor: req.user._id, type: 'inquiry_accepted', message: `${req.user.name} accepted your inquiry`, refModel: 'Inquiry', refId: inquiry._id });
  res.json({ success: true, data: inquiry });
});

// @desc    Seller rejects an inquiry
// @route   PATCH /api/inquiries/:id/reject
// @access  Private
const rejectInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  if (String(inquiry.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the seller can reject an inquiry');
  }
  inquiry.status = 'rejected';
  await inquiry.save();
  await notify({ recipient: inquiry.buyer, actor: req.user._id, type: 'inquiry_rejected', message: `${req.user.name} declined your inquiry`, refModel: 'Inquiry', refId: inquiry._id });
  res.json({ success: true, data: inquiry });
});

// @desc    Seller reserves the product for this inquiry
// @route   PATCH /api/inquiries/:id/reserve
// @access  Private
const reserveInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  if (String(inquiry.seller) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the seller can reserve for an inquiry');
  }
  inquiry.status = 'reserved';
  await inquiry.save();
  res.json({ success: true, data: inquiry });
});

// @desc    Cancel an inquiry (buyer or seller)
// @route   PATCH /api/inquiries/:id/cancel
// @access  Private
const cancelInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }
  assertParty(inquiry, req.user._id);
  inquiry.status = 'cancelled';
  await inquiry.save();
  res.json({ success: true, data: inquiry });
});

module.exports = {
  createInquiry,
  listInquiries,
  getInquiry,
  replyToInquiry,
  acceptInquiry,
  rejectInquiry,
  reserveInquiry,
  cancelInquiry,
};
