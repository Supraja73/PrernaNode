const mongoose = require('mongoose');

const PRODUCT_CATEGORIES = [
  'Handmade Products', 'Art', 'Jewellery', 'Digital Products', 'Courses',
  'Templates', 'Services', 'Books', 'Clothing', 'Accessories',
  'Home Decor', 'Beauty Products', 'Health Products',
];

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: null },

    name: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, enum: PRODUCT_CATEGORIES },
    tags: [{ type: String, trim: true, lowercase: true }],

    images: [{ url: { type: String, required: true }, publicId: { type: String, required: true } }],
    video: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },

    stock: { type: Number, default: 1, min: 0 },
    availability: { type: String, enum: ['in-stock', 'made-to-order', 'out-of-stock'], default: 'in-stock' },
    shippingInfo: { type: String, trim: true, maxlength: 500, default: '' },
    condition: { type: String, enum: ['new', 'used', 'refurbished', 'digital'], default: 'new' },
    featured: { type: Boolean, default: false },

    status: { type: String, enum: ['active', 'hidden', 'sold'], default: 'active', index: true },

    viewCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ featured: -1, createdAt: -1 });

productSchema.statics.CATEGORIES = PRODUCT_CATEGORIES;

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = PRODUCT_CATEGORIES;
