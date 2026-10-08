const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, trim: true },
    degree: { type: String, trim: true },
    field: { type: String, trim: true },
    startYear: Number,
    endYear: Number,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['member', 'mentor', 'seller', 'moderator', 'admin'],
      default: 'member',
    },

    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    cover: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    headline: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 600, default: '' },
    location: { type: String, trim: true, default: '' },
    languages: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],

    education: [educationSchema],
    experience: [experienceSchema],

    socialLinks: {
      website: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },

    lastLogin: { type: Date },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    // Part 5 additions — moderation state, distinct from isBanned (harder/permanent).
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, trim: true, default: '' },
    suspendedUntil: { type: Date },
    warningsCount: { type: Number, default: 0 },
    banReason: { type: String, trim: true, default: '' },
    // Distinct from email verification above — a "verified badge" of identity/credibility.
    verificationBadgeStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },

    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ name: 'text', username: 'text', headline: 'text', skills: 'text' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return rawToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h
  return rawToken;
};

// Weighted completion score across the fields that make a profile useful to others.
userSchema.methods.calculateProfileCompletion = function () {
  const checks = [
    { done: !!this.avatar?.url, weight: 15 },
    { done: !!this.cover?.url, weight: 5 },
    { done: !!this.headline, weight: 15 },
    { done: !!this.bio, weight: 15 },
    { done: !!this.location, weight: 5 },
    { done: (this.skills || []).length > 0, weight: 15 },
    { done: (this.languages || []).length > 0, weight: 5 },
    { done: (this.education || []).length > 0, weight: 10 },
    { done: (this.experience || []).length > 0, weight: 10 },
    {
      done: !!(this.socialLinks?.website || this.socialLinks?.github || this.socialLinks?.linkedin || this.socialLinks?.portfolio),
      weight: 5,
    },
  ];
  const total = checks.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
  return Math.min(100, total);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  obj.profileCompletion = this.calculateProfileCompletion();
  return obj;
};

module.exports = mongoose.model('User', userSchema);
