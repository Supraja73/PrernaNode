const Review = require('../models/Review');

const modelsByType = () => ({
  skill: require('../models/Skill'),
  business: require('../models/Business'),
  product: require('../models/Product'),
});

// Recomputes averageRating/reviewsCount on the reviewed document from real Review data
// (never hardcoded) — called after any review create/edit/delete.
const recalculateRating = async (targetType, targetId) => {
  const Model = modelsByType()[targetType];
  if (!Model) return;

  const agg = await Review.aggregate([
    { $match: { targetType, targetId: targetId, hidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = agg[0] || {};
  await Model.findByIdAndUpdate(targetId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewsCount: count,
  });
};

module.exports = { recalculateRating };
