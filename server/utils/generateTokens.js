const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

// "Remember me" extends the refresh token lifetime from 1 day to 30 days.
const REMEMBER_ME_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';
const SESSION_ONLY_EXPIRES = '1d';

const generateRefreshToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRES : SESSION_ONLY_EXPIRES;
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

const msFromExpiry = (expiresIn) => {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 24 * 60 * 60 * 1000; // fallback: 1 day
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[unit];
};

const refreshCookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: msFromExpiry(rememberMe ? REMEMBER_ME_EXPIRES : SESSION_ONLY_EXPIRES),
  path: '/api/auth',
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshCookieOptions,
  msFromExpiry,
  REMEMBER_ME_EXPIRES,
  SESSION_ONLY_EXPIRES,
};
