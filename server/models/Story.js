const mongoose = require('mongoose');

const STORY_CATEGORIES = [
  'Career',
  'Education',
  'Entrepreneurship',
  'Technology',
  'Research',
  'Sports',
  'Health',
  'Arts',
  'Finance',
  'Government Exams',
  'Personal Growth',
];

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 4,
      maxlength: 140,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 12000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: STORY_CATEGORIES,
    },
    hashtags: [{ type: String, trim: true, lowercase: true }],

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    video: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date },

    pinned: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storySchema.index({ title: 'text', description: 'text', hashtags: 'text' });
storySchema.index({ status: 1, publishedAt: -1 });
storySchema.index({ author: 1, status: 1 });
storySchema.index({ hashtags: 1 });
storySchema.index({ category: 1, status: 1 });

storySchema.methods.toPublicObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

storySchema.statics.CATEGORIES = STORY_CATEGORIES;

module.exports = mongoose.model('Story', storySchema);
module.exports.CATEGORIES = STORY_CATEGORIES;
