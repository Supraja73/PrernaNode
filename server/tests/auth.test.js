const request = require('supertest');
const buildTestApp = require('./testApp');
const User = require('../models/User');

const app = buildTestApp();

const validUser = {
  name: 'Test User',
  username: 'testuser1',
  email: 'testuser1@example.com',
  password: 'Password123',
};

describe('Auth: register', () => {
  it('creates an unverified account', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ email: validUser.email });
    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(false);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send({ ...validUser, username: 'differentname' });
    expect(res.status).toBe(409);
  });
});

describe('Auth: login', () => {
  it('rejects login before email verification', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(403);
  });

  it('logs in after verification and returns an access token + refresh cookie', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    await User.updateOne({ email: validUser.email }, { isVerified: true });

    const res = await request(app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    await User.updateOne({ email: validUser.email }, { isVerified: true });

    const res = await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });
});

describe('Auth: protected routes', () => {
  it('rejects /me with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the user with a valid access token', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    await User.updateOne({ email: validUser.email }, { isVerified: true });
    const login = await request(app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password });
    const token = login.body.data.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(validUser.email);
  });
});
