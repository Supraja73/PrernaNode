const request = require('supertest');
const buildTestApp = require('./testApp');

const app = buildTestApp();

describe('Registration validation', () => {
  it('rejects a password under 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pass', username: 'shortpass', email: 'shortpass@example.com', password: 'Ab1',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a username with invalid characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Username', username: 'Not Valid!', email: 'badusername@example.com', password: 'Password123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email', username: 'bademail', email: 'not-an-email', password: 'Password123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a password with no number', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Number', username: 'nonumber', email: 'nonumber@example.com', password: 'PasswordOnly',
    });
    expect(res.status).toBe(400);
  });
});
