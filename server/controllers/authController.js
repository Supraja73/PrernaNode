const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Session = require('../models/Session');
const sendEmail = require('../utils/sendEmail');
const {
  generateAccessToken,
  generateRefreshToken,
  refreshCookieOptions,
  msFromExpiry,
  REMEMBER_ME_EXPIRES,
  SESSION_ONLY_EXPIRES,
} = require('../utils/generateTokens');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const createSession = async (user, refreshToken, rememberMe, req) => {
  const expiresAt = new Date(Date.now() + msFromExpiry(rememberMe ? REMEMBER_ME_EXPIRES : SESSION_ONLY_EXPIRES));
  await Session.create({
    user: user._id,
    tokenHash: Session.hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || 'Unknown device',
    ip: req.ip,
    rememberMe,
    expiresAt,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] });
  if (existing) {
    res.status(409);
    throw new Error(
      existing.email === email ? 'An account with this email already exists' : 'This username is already taken'
    );
  }

  const user = await User.create({ name, username: username.toLowerCase(), email, password });

  const rawToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${CLIENT_URL}/verify-email/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your PRERNA account',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #08060f; color: #f4f1fa; border-radius: 12px;">
          <h2 style="color: #f4f1fa; margin-top: 0;">Welcome to PRERNA, ${user.name}!</h2>
          <p style="color: #a79fc2; line-height: 1.6;">Thank you for registering. Please verify your email address to activate your account and start exploring:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #a79fc2; font-size: 13px; line-height: 1.5;">Or copy and paste this link in your browser:<br/><a href="${verifyUrl}" style="color: #06b6d4;">${verifyUrl}</a></p>
          <p style="color: #635c78; font-size: 12px; margin-bottom: 0;">This verification link expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send verification email during registration:', err.message);
    await User.findByIdAndDelete(user._id);
    res.status(500);
    throw new Error('Account creation failed because the verification email could not be sent: ' + err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Account created. Check your email to verify your account.',
    data: { id: user._id, email: user.email, username: user.username },
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  if (!req.params.token) {
    res.status(400);
    throw new Error('Verification token is required');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() },
  }).select('+verificationToken +verificationTokenExpires');

  if (!user) {
    res.status(400);
    throw new Error('Verification link is invalid or has expired');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified. You can now log in.' });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.isVerified) {
    return res.json({
      success: true,
      message: 'If an account exists with this email and is unverified, a new verification email has been sent.',
    });
  }

  const rawToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });
  const verifyUrl = `${CLIENT_URL}/verify-email/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your PRERNA account',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #08060f; color: #f4f1fa; border-radius: 12px;">
          <h2 style="color: #f4f1fa; margin-top: 0;">Hello ${user.name},</h2>
          <p style="color: #a79fc2; line-height: 1.6;">Here is your requested email verification link for your PRERNA account:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #a79fc2; font-size: 13px; line-height: 1.5;">Or copy and paste this link in your browser:<br/><a href="${verifyUrl}" style="color: #06b6d4;">${verifyUrl}</a></p>
          <p style="color: #635c78; font-size: 12px; margin-bottom: 0;">This verification link expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Failed to send verification email: ' + err.message);
  }

  res.json({
    success: true,
    message: 'If an account exists with this email and is unverified, a new verification email has been sent.',
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('This account has been suspended');
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id, !!rememberMe);

  await createSession(user, refreshToken, !!rememberMe, req);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions(!!rememberMe));

  res.json({
    success: true,
    data: {
      user: user.toSafeObject(),
      accessToken,
    },
  });
});

// @desc    Refresh access token using the httpOnly cookie
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Refresh token invalid or expired');
  }

  const tokenHash = Session.hashToken(token);
  const session = await Session.findOne({ user: decoded.id, tokenHash });

  if (!session) {
    res.status(401);
    throw new Error('Session not recognized. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Account no longer exists');
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id, session.rememberMe);

  session.tokenHash = Session.hashToken(newRefreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(
    Date.now() + msFromExpiry(session.rememberMe ? REMEMBER_ME_EXPIRES : SESSION_ONLY_EXPIRES)
  );
  await session.save();

  res.cookie('refreshToken', newRefreshToken, refreshCookieOptions(session.rememberMe));

  res.json({ success: true, data: { accessToken: newAccessToken } });
});

// @desc    Logout - invalidate the current session only
// @route   POST /api/auth/logout
// @access  Public
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await Session.deleteOne({ user: decoded.id, tokenHash: Session.hashToken(token) });
    } catch (err) {
      // token already invalid/expired - nothing to clean up
    }
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true, message: 'Logged out' });
});

// @desc    List active sessions/devices for the logged-in user
// @route   GET /api/auth/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.refreshToken;
  const currentHash = currentToken ? Session.hashToken(currentToken) : null;

  const sessions = await Session.find({ user: req.user._id }).sort({ lastUsedAt: -1 });

  res.json({
    success: true,
    data: sessions.map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ip: s.ip,
      rememberMe: s.rememberMe,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: s.tokenHash === currentHash,
    })),
  });
});

// @desc    Revoke a specific session (log out a device remotely)
// @route   DELETE /api/auth/sessions/:id
// @access  Private
const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  await session.deleteOne();
  res.json({ success: true, message: 'Session revoked' });
});

// @desc    Forgot password - send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  };

  if (!user) return res.json(genericResponse);

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${CLIENT_URL}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your PrernaNode password',
      html: `<p>Hi ${user.name},</p><p>Reset your password using the link below. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Could not send reset email. Please try again later.');
  }

  res.json(genericResponse);
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Changing the password logs out every device.
  await Session.deleteMany({ user: user._id });

  res.json({ success: true, message: 'Password reset. You can now log in.' });
});

// @desc    Get the logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  getSessions,
  revokeSession,
  forgotPassword,
  resetPassword,
  getMe,
};
