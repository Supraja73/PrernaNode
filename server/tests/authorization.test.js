const request = require('supertest');
const jwt = require('jsonwebtoken');
const buildTestApp = require('./testApp');
const User = require('../models/User');

const app = buildTestApp();

const makeToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

describe('Role-based authorization', () => {
  it('blocks a regular member from the admin dashboard', async () => {
    const member = await User.create({
      name: 'Member', username: 'member1', email: 'member1@example.com', password: 'Password123', isVerified: true,
    });
    const token = makeToken(member);

    const res = await request(app).get('/api/admin/dashboard/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin to reach the admin dashboard', async () => {
    const admin = await User.create({
      name: 'Admin', username: 'admin1', email: 'admin1@example.com', password: 'Password123', isVerified: true, role: 'admin',
    });
    const token = makeToken(admin);

    const res = await request(app).get('/api/admin/dashboard/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeDefined();
  });

  it('blocks a moderator from admin-only ban action (moderators can suspend, not ban)', async () => {
    const moderator = await User.create({
      name: 'Mod', username: 'mod1', email: 'mod1@example.com', password: 'Password123', isVerified: true, role: 'moderator',
    });
    const target = await User.create({
      name: 'Target', username: 'target1', email: 'target1@example.com', password: 'Password123', isVerified: true,
    });
    const token = makeToken(moderator);

    const res = await request(app).patch(`/api/admin/users/${target._id}/ban`).set('Authorization', `Bearer ${token}`).send({ reason: 'test' });
    expect(res.status).toBe(403);
  });

  it('rejects a suspended user from any protected route', async () => {
    const user = await User.create({
      name: 'Suspended', username: 'suspended1', email: 'suspended1@example.com', password: 'Password123',
      isVerified: true, isSuspended: true, suspensionReason: 'test suspension',
    });
    const token = makeToken(user);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});
