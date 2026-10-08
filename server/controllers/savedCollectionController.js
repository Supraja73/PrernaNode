const asyncHandler = require('express-async-handler');
const SavedCollection = require('../models/SavedCollection');
const Skill = require('../models/Skill');
const Business = require('../models/Business');
const Product = require('../models/Product');

const DEFAULT_COLLECTION = 'Saved';

const getOrCreateDefault = async (userId) => {
  let collection = await SavedCollection.findOne({ user: userId, name: DEFAULT_COLLECTION });
  if (!collection) collection = await SavedCollection.create({ user: userId, name: DEFAULT_COLLECTION, items: [] });
  return collection;
};

// @desc    List the logged-in user's collections
// @route   GET /api/collections
// @access  Private
const listCollections = asyncHandler(async (req, res) => {
  const collections = await SavedCollection.find({ user: req.user._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: collections.map((c) => ({ _id: c._id, name: c.name, itemCount: c.items.length, createdAt: c.createdAt })) });
});

// @desc    Create a new named collection
// @route   POST /api/collections
// @access  Private
const createCollection = asyncHandler(async (req, res) => {
  try {
    const collection = await SavedCollection.create({ user: req.user._id, name: req.body.name, items: [] });
    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('You already have a collection with that name');
    }
    throw err;
  }
});

// @desc    Rename a collection
// @route   PATCH /api/collections/:id
// @access  Private
const renameCollection = asyncHandler(async (req, res) => {
  const collection = await SavedCollection.findOne({ _id: req.params.id, user: req.user._id });
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  collection.name = req.body.name;
  await collection.save();
  res.json({ success: true, data: collection });
});

// @desc    Delete a collection
// @route   DELETE /api/collections/:id
// @access  Private
const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await SavedCollection.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  res.json({ success: true, message: 'Collection deleted' });
});

// @desc    View items in a collection, hydrated with the real mentor/business/product docs
// @route   GET /api/collections/:id
// @access  Private
const getCollectionItems = asyncHandler(async (req, res) => {
  const collection = await SavedCollection.findOne({ _id: req.params.id, user: req.user._id });
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const byType = { mentor: [], business: [], product: [] };
  collection.items.forEach((i) => byType[i.resourceType]?.push(i.resourceId));

  const [mentors, businesses, products] = await Promise.all([
    Skill.find({ _id: { $in: byType.mentor } }).populate('mentor', 'name username avatar'),
    Business.find({ _id: { $in: byType.business } }),
    Product.find({ _id: { $in: byType.product } }),
  ]);

  res.json({
    success: true,
    data: { _id: collection._id, name: collection.name, mentors, businesses: businesses.map((b) => b.toPublicObject(req.user._id)), products },
  });
});

// @desc    Save an item to a collection (creates the default "Saved" collection if none specified)
// @route   POST /api/collections/save
// @access  Private
const saveItem = asyncHandler(async (req, res) => {
  const { resourceType, resourceId, collectionId } = req.body;
  const collection = collectionId
    ? await SavedCollection.findOne({ _id: collectionId, user: req.user._id })
    : await getOrCreateDefault(req.user._id);

  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const exists = collection.items.some((i) => i.resourceType === resourceType && String(i.resourceId) === String(resourceId));
  if (exists) {
    res.status(409);
    throw new Error('Already saved to this collection');
  }

  collection.items.push({ resourceType, resourceId });
  await collection.save();

  if (resourceType === 'product') {
    await Product.findByIdAndUpdate(resourceId, { $inc: { savesCount: 1 } });
  }

  res.json({ success: true, data: { collectionId: collection._id, itemCount: collection.items.length } });
});

// @desc    Remove an item from a collection
// @route   DELETE /api/collections/:id/items
// @access  Private
const removeItem = asyncHandler(async (req, res) => {
  const collection = await SavedCollection.findOne({ _id: req.params.id, user: req.user._id });
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  const { resourceType, resourceId } = req.body;
  const before = collection.items.length;
  collection.items = collection.items.filter((i) => !(i.resourceType === resourceType && String(i.resourceId) === String(resourceId)));
  await collection.save();

  if (before !== collection.items.length && resourceType === 'product') {
    await Product.findByIdAndUpdate(resourceId, { $inc: { savesCount: -1 } });
  }

  res.json({ success: true, data: { itemCount: collection.items.length } });
});

module.exports = {
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  getCollectionItems,
  saveItem,
  removeItem,
};
